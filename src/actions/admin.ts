'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, LetterDocument, MemoDocument, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { isObjectIdOrHexString } from "mongoose";
import { SignatureApprovals, UserDocument } from '../lib/modelInterfaces';
import { HighestPosition } from '../lib/types';
import { addNotification, broadcastNotification } from "./notifications";
import { ActionResponseType } from "./superadmin";


const role = Roles.Admin;

function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export async function saveMemorandumLetter(departmentId: string, doctype: DocumentType, rejectedId: string|null, cc: string[], eSignatures: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const preparedBy = session.user._id?.toString();
      const department = await Department.findById(departmentId).exec()
      if (!department) {
        return {
          error: 'Department not found'
        }
      }
      const departmentName = department.name
      const content = formData.get('content')
      const title = formData.get('title')
      const series = formData.get('series')
      if (!content) {
        return {
          error: 'Memorandum title should not be empty'
        }
      }
      const signatureApprovals = await Promise.all(eSignatures.map(async (signatureId: string) => {
        const es = await ESignature.findOne({ _id: signatureId }).populate('adminId').exec();
        return {
            signature_id: signatureId,
            priority: es.adminId?.highestPosition === HighestPosition.Admin ? 1 : (
              es.adminId?.highestPosition === HighestPosition.VicePresident ? 2 : 3
            )
        }
      }));
      if (doctype === DocumentType.Memo && session.user.highestPosition !== HighestPosition.President && !signatureApprovals.some((sa) => sa.priority === 2) && !signatureApprovals.some((sa) => sa.priority === 3)) {
        return {
          error: "President's Signature approval should be required"
        }
      }
      if (doctype === DocumentType.Memo) {
        if (!!rejectedId) {
          try {
            const memo = await Memo.findByIdAndUpdate(
              rejectedId,
              {
                content,
                signatureApprovals,
                $addToSet: {
                  cc: { $each: cc }
                }
              },
              { upsert: false, runValidators: true, new: true }
            ).exec();
            try {
              await addNotification(memo.preparedBy.toHexString(), {
                title: 'Revised Memorandum Pending Approval',
                message: memo.title + ' for ' + departmentName + ' by you',
                href: '/' + role + '/approvals/memo?id=' + memo._id
              })
            } catch (e) {
              console.log(e)
            }
            let saproves = signatureApprovals.filter((sa) => sa.priority === 1);
            if (saproves.length === 0) {
              saproves = signatureApprovals.filter((sa) => sa.priority === 2);
            }
            if (saproves.length === 0) {
              saproves = signatureApprovals.filter((sa) => sa.priority === 3);
            }
            await Promise.all(saproves.map(async (sa) => {
              try {
                const eSig = await ESignature.findById(sa.signature_id).exec();
                const userSig = await User.findById(eSig.adminId.toHexString()).exec();
                const preparedByUser = await User.findById(memo.preparedBy).lean<UserDocument>().exec();
                const fullName = preparedByUser ? getFullName(preparedByUser) : "";
                await addNotification(userSig._id.toHexString(), {
                  title: 'Revised Memorandum Pending Approval',
                  message: memo.title + ' for ' + departmentName + ' by ' + fullName,
                  href: '/' + role + '/approvals/memo?id=' + memo._id
                });
              } catch (e) {
                console.log(e)
              }
            }));
            return {
              success: 'Revised Memorandum Saved and Sent for Approval',
              memorandumId: memo._id.toHexString()
            }
          } catch (e) {
            console.log("Failed to updated and revise memo: ", e);
          }
        }
        const memo = await Memo.create({
          departmentId,
          title,
          series,
          cc,
          content,
          preparedBy,
          signatureApprovals
        })
        if (!!memo?._id) {
          try {
            await addNotification(memo.preparedBy.toHexString(), {
              title: 'New Memorandum Pending Approval',
              message: memo.title + ' for ' + departmentName + ' by you',
              href: '/' + role + '/approvals/memo?id=' + memo._id
            })
          } catch (e) {
            console.log(e)
          }
          let saproves = signatureApprovals.filter((sa) => sa.priority === 1);
          if (saproves.length === 0) {
            saproves = signatureApprovals.filter((sa) => sa.priority === 2);
          }
          if (saproves.length === 0) {
            saproves = signatureApprovals.filter((sa) => sa.priority === 3);
          }
          await Promise.all(saproves.map(async (sa) => {
            try {
              const eSig = await ESignature.findById(sa.signature_id).exec();
              const userSig = await User.findById(eSig.adminId.toHexString()).exec();
              const preparedByUser = session.user
              await addNotification(userSig._id.toHexString(), {
                title: 'New Memorandum Pending Approval',
                message: memo.title + ' for ' + departmentName + ' by ' + preparedByUser.fullName,
                href: '/' + role + '/approvals/memo?id=' + memo._id
              })
            } catch (e) {
              console.log(e)
            }
          }));
          return {
            success: 'Memorandum Saved and Sent for Approval',
            memorandumId: memo._id.toHexString()
          }
        }
      } else if (doctype === DocumentType.Letter) {
        if (!!rejectedId) {
          try {
            const letter = await Letter.findByIdAndUpdate(
              rejectedId,
              {
                content,
                signatureApprovals,
                $addToSet: {
                  cc: { $each: cc }
                }
              },
              { upsert: false, runValidators: true, new: true }
            ).exec();
            try {
              await addNotification(letter.preparedBy.toHexString(), {
                title: 'Revised Memorandum Pending Approval',
                message: letter.title + ' for ' + departmentName + ' by you',
                href: '/' + role + '/approvals/letter?id=' + letter._id
              })
            } catch (e) {
              console.log(e)
            }
            let saproves = signatureApprovals.filter((sa) => sa.priority === 1);
            if (saproves.length === 0) {
              saproves = signatureApprovals.filter((sa) => sa.priority === 2);
            }
            if (saproves.length === 0) {
              saproves = signatureApprovals.filter((sa) => sa.priority === 3);
            }
            await Promise.all(saproves.map(async (sa) => {
              try {
                const eSig = await ESignature.findById(sa.signature_id).exec();
                const userSig = await User.findById(eSig.adminId.toHexString()).exec();
                const preparedByUser = await User.findById(letter.preparedBy).lean<UserDocument>().exec();
                const fullName = preparedByUser ? getFullName(preparedByUser) : "";
                await addNotification(userSig._id.toHexString(), {
                  title: 'Revised Letter Pending Approval',
                  message: letter.title + ' for ' + departmentName + ' by ' + fullName,
                  href: '/' + role + '/approvals/letter?id=' + letter._id
                })
              } catch (e) {
                console.log(e)
              }
            }));
            return {
              success: 'Revised Letter Saved and Sent for Approval',
              memorandumId: letter._id.toHexString()
            }
          } catch (e) {
            console.log("Failed to updated and revise memo: ", e);
          }
        }
        const letter = await Letter.create({
          departmentId,
          title,
          series,
          cc,
          content,
          preparedBy,
          signatureApprovals
        })
        if (!!letter?._id) {
          try {
            await addNotification(letter.preparedBy.toHexString(), {
              title: 'New Letter Pending Approval',
              message: letter.title + ' for ' + departmentName + ' by you',
              href: '/' + role + '/approvals/letter?id=' + letter._id
            })
          } catch (e) {
            console.log(e)
          }
          let saproves = signatureApprovals.filter((sa) => sa.priority === 1);
          if (saproves.length === 0) {
            saproves = signatureApprovals.filter((sa) => sa.priority === 2);
          }
          if (saproves.length === 0) {
            saproves = signatureApprovals.filter((sa) => sa.priority === 3);
          }
          await Promise.all(saproves.map(async (sa) => {
            try {
              const eSig = await ESignature.findById(sa.signature_id).exec();
              const userSig = await User.findById(eSig.adminId.toHexString()).exec();
              const preparedByUser = session.user
              await addNotification(userSig._id.toHexString(), {
                title: 'New Letter Pending Approval',
                message: letter.title + ' for ' + departmentName + ' by ' + preparedByUser.fullName,
                href: '/' + role + '/approvals/letter?id=' + letter._id
              })
            } catch (e) {
              console.log(e)
            }
          }))
          return {
            success: 'Letter Saved and Sent for Approval.',
            memorandumId: letter._id.toHexString()
          }
        }
      } else {
        return {
          error: 'Invalid document type'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}


export async function saveMemorandumLetterToIndividual(individualId: string, doctype: DocumentType, cc: string[], eSignatures: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const preparedBy = session.user._id;
      const individual = await User.findById(individualId).lean<UserDocument>().exec()
      if (!individual || (!!individual && !individual?._id)) {
        return {
          error: 'Employee not found'
        }
      }
      const individual_id = individual._id!.toString();
      const content = formData.get('content')
      const title = formData.get('title')
      const series = formData.get('series')
      if (!content) {
        return {
          error: 'Memorandum title should not be empty'
        }
      }
      const signatureApprovals = await Promise.all(eSignatures.map(async (signatureId: string) => {
        const es = await ESignature.findOne({ _id: signatureId }).populate('adminId').exec();
        return {
            signature_id: signatureId,
            priority: es.adminId?.highestPosition === HighestPosition.Admin ? 1 : (
              es.adminId?.highestPosition === HighestPosition.VicePresident ? 2 : 3
            )
        }
      }));
      if (doctype === DocumentType.Memo) {
        const memo = await MemoIndividual.create({
          userId: individual_id,
          title,
          series,
          cc,
          signatureApprovals,
          content: content,
          preparedBy,
        })
        if (!!memo?._id) {
          try {
            const href = individual.role === role ? '/' + role + '/received/memo?id=' + memo._id : '/' + Roles.Faculty + '/memo?id=' + memo._id;
            await addNotification(individual_id, {
              title: 'New Memorandum Sent to you',
              message: memo.title + ' for ' + individual.firstName + ' ' + individual.lastName,
              href
            })
          } catch (e) {
            console.log(e)
          }
          try {
            await addNotification(preparedBy, {
              title: 'New Memorandum Sent to ' + individual.firstName + ' ' + individual.lastName,
              message: memo.title + ' for ' + individual.firstName + ' ' + individual.lastName,
              href: '/' + role + '/forwarded/memo?id=' + memo._id
            })
          } catch (e) {
            console.log(e);
          }
          return {
            success: 'Memorandum Sent',
            memorandumId: memo._id.toHexString()
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const letter = await LetterIndividual.create({
          userId: individual_id,
          title,
          series,
          cc,
          signatureApprovals,
          content: content,
          preparedBy,
        })
        try {
          const href = individual.role === role ? '/' + role + '/received/letter?id=' + letter._id : '/' + Roles.Faculty + '/letter?id=' + letter._id;
          await addNotification(individual_id, {
            title: 'New Memorandum Sent to you',
            message: letter.title + ' for ' + individual.firstName + ' ' + individual.lastName,
            href,
          })
        } catch (e) {
          console.log(e)
        }
        try {
          await addNotification(preparedBy, {
            title: 'New Memorandum Sent to ' + individual.firstName + ' ' + individual.lastName,
            message: letter.title + ' for ' + individual.firstName + ' ' + individual.lastName,
            href: '/' + role + '/forwarded/letter?id=' + letter._id
          })
        } catch (e) {
          console.log(e);
        }
        return {
          success: 'Memorandum Sent',
          memorandumId: letter._id.toHexString()
        }
      } else {
        return {
          error: 'Invalid document type'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}

export async function signMemoLetterIndividual(doctype: DocumentType, memoLetterIndividualId: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).lean<ESignatureDocument>().exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toString()
        if (doctype === DocumentType.Memo) {
          const memo = await MemoIndividual.findById(memoLetterIndividualId).exec()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const u = await User.findById(memo.preparedBy).lean<UserDocument>().exec();
            const eu = await User.findById(eSignature.adminId.toString()).lean<UserDocument>().exec();
            if (u?._id && eu?._id) {
              await addNotification(u._id.toString(), {
                title: 'Signature signed by ' + getFullName(eu),
                message: memo.title + ' (Individual) signed.',
                href: '/' + role + '/received/memo?id=' + memo._id
              });
            }
            return {
              success: "Memorandum signed successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await LetterIndividual.findById(memoLetterIndividualId).exec()
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const u = await User.findById(letter.preparedBy).lean<UserDocument>().exec();
            const eu = await User.findById(eSignature.adminId.toString()).lean<UserDocument>().exec();
            if (u?._id && eu?._id) {
              await addNotification(u._id.toString(), {
                title: 'Signature signed by ' + getFullName(eu),
                message: letter.title + ' (Individual) signed.',
                href: '/' + role + '/received/letter?id=' + letter._id
              });
            }
            return {
              success: "Letter signed successfully",
            }
          }
        }
      }
    }
  }  catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to sign'
  }
}

export async function approveMemorandumLetter(doctype: DocumentType, memoLetterId: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toHexString()
        if (doctype === DocumentType.Memo) {
          const memo = await Memo.findById(memoLetterId).exec()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const jsonizedUpdated: MemoDocument = JSON.parse(JSON.stringify(updated));
            if (jsonizedUpdated.signatureApprovals.every((signatureApproval: any) => !!signatureApproval.approvedDate)) {
              const title = 'New Memorandum Release'
              const message = memo.title
              const href = '/' + Roles.Faculty + '/memo?id=' + memo._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Faculty, departmentId: memo.departmentId as string, title, message, href })
              } catch (e) {
                console.log(e)
              }
              const titleAdmin = 'Memorandum Released'
              const messageAdmin = memo.title
              const hrefAdmin = '/' + role + '/approved/memo?id=' + memo._id.toHexString()
              try {
                await broadcastNotification({ role: role, departmentId: memo.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
              } catch (e) {
                console.log(e)
              }
            } else {
              try {
                let prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 1 && !sa.approvedDate);
                if (prio.length === 0) {
                  prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 2 && !sa.approvedDate);
                }
                if (prio.length === 0) {
                  prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 3 && !sa.approvedDate);
                }
                const department = await Department.findById(jsonizedUpdated.departmentId).exec()
                const departmentName = department?.name
                await Promise.all(prio.map(async (sa) => {
                  const eSig = await ESignature.findById(sa.signature_id).exec();
                  const userSig = await User.findById(eSig.adminId.toHexString()).exec();
                  const preparedByUser = await User.findById(jsonizedUpdated.preparedBy).lean<UserDocument>().exec();
                  const fullName = preparedByUser ? getFullName(preparedByUser) : "";
                  await addNotification(userSig._id.toHexString(), {
                    title: 'New Memorandum Pending Approval',
                    message: memo.title + ' for ' + departmentName + ' by ' + fullName,
                    href: '/' + role + '/approvals/memo?id=' + memo._id
                  })
                }))
              } catch (e) {
                console.log(e)
              }
            }
            return {
              success: "Memorandum approved successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const jsonizedUpdated: LetterDocument = JSON.parse(JSON.stringify(updated));
            if (jsonizedUpdated.signatureApprovals.every((signatureApproval: any) => !!signatureApproval.approvedDate)) {
              const title = 'New Letter Release'
              const message = letter.title
              const href = '/' + Roles.Faculty + '/memo?id=' + letter._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Faculty, departmentId: letter.departmentId as string, title, message, href })
              } catch (e) {
                console.log(e)
              }
              const titleAdmin = 'Letter Approved'
              const messageAdmin = letter.title
              const hrefAdmin = '/' + role + '/approved/memo?id=' + letter._id.toHexString()
              try {
                await broadcastNotification({ role: role, departmentId: letter.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
              } catch (e) {
                console.log(e)
              }
            } else {
              try {
                let prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 1 && !sa.approvedDate);
                if (prio.length === 0) {
                  prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 2 && !sa.approvedDate);
                }
                if (prio.length === 0) {
                  prio = jsonizedUpdated.signatureApprovals.filter((sa) => sa.priority === 3 && !sa.approvedDate);
                }
                const department = await Department.findById(jsonizedUpdated.departmentId).exec()
                const departmentName = department?.name
                await Promise.all(prio.map(async (sa) => {
                  const eSig = await ESignature.findById(sa.signature_id).exec();
                  const userSig = await User.findById(eSig.adminId.toHexString()).exec();
                  const preparedByUser = await User.findById(jsonizedUpdated.preparedBy).exec();
                  const fullName = preparedByUser ? getFullName(preparedByUser) : ""
                  await addNotification(userSig._id.toHexString(), {
                    title: 'New Letter Pending Approval',
                    message: letter.title + ' for ' + departmentName + ' by ' + fullName,
                    href: '/' + role + '/approvals/letter?id=' + letter._id
                  })
                }))
              } catch (e) {
                console.log(e)
              }
            }
            return {
              success: "Letter approved successfully",
            }
          }
        } else {
          return {
            error: 'Invalid document type'
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to approve'
  }
}

export async function rejectMemorandumLetter(doctype: DocumentType, memoLetterId: string, rejectedReason: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toHexString()
        if (doctype === DocumentType.Memo) {
          const memo = await Memo.findById(memoLetterId).populate('departmentId').exec()
          const departmentName = memo.departmentId.name
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedReason = rejectedReason
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const title = 'Memorandum Rejected'
            const message = memo.title + ' for ' + departmentName + ' by '+ session.user.fullName
            const href = '/' + role + '/approvals/memo?id=' + memo._id.toHexString() + '&show=rejected'
            try {
              await addNotification(memo.preparedBy.toHexString(), {
                title,
                message: memo.title,
                href
              })
            } catch (e) {
              console.log(e)
            }
            await Promise.all(
              JSON.parse(JSON.stringify(memo))
              .signatureApprovals
              .filter((sa: SignatureApprovals) => !!sa.approvedDate || !!sa.rejectedDate)
              .map(async (signatureApproval: SignatureApprovals) => {
                try {
                  const eSig = await ESignature.findById(signatureApproval.signature_id).exec()
                  const userSign = await User.findById(eSig.adminId.toHexString()).exec()
                  await addNotification(userSign._id.toHexString(), {
                    title,
                    message,
                    href
                  })
                } catch (e) {
                  console.log(e)
                }
              }
              )
            )
            return {
              success: "Memorandum rejected successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          const departmentName = letter.departmentId.name
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const title = 'Letter Rejected'
            const message = letter.title + ' for ' + departmentName + ' by '+ session.user.fullName
            const href = '/' + role + '/approvals/memo?id=' + letter._id.toHexString() + '&show=rejected'
            try {
              await addNotification(letter.preparedBy.toHexString(), {
                title,
                message: letter.title,
                href
              })
            } catch (e) {
              console.log(e)
            }
            await Promise.all(
              JSON.parse(JSON.stringify(letter))
              .signatureApprovals
              .filter((sa: SignatureApprovals) => !!sa.approvedDate || !!sa.rejectedDate)
              .map(async (signatureApproval: SignatureApprovals) => {
              try {
                const eSig = await ESignature.findById(signatureApproval.signature_id).exec()
                const userSign = await User.findById(eSig.adminId.toHexString()).exec()
                await addNotification(userSign._id.toHexString(), {
                  title,
                  message,
                  href
                })
              } catch (e) {
                console.log(e)
              }
            }))
            return {
              success: "Letter rejected successfully",
            }
          }
        } else {
          return {
            error: 'Invalid document type'
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to reject'
  }
}


export async function saveESignature(id: string|undefined, eSignatureDataURL?: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!id) {
      return {
        error: 'Invalid Account ID'
      }
    }
    if (!eSignatureDataURL) {
      return {
        error: 'Invalid e-Signature'
      }
    }
    const account = await User.findById(id).exec();
    if (!!account) {
      const esignature = await ESignature.create({
        adminId: account._id.toHexString(),
        signature: eSignatureDataURL,
      })
      if (!!esignature) {
        return {
          success: 'e-Signature saved successfully'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save e-signature'
  }
}


export async function updateESignature(eSignatureDataURL?: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!eSignatureDataURL) {
      return {
        error: 'Invalid e-Signature'
      }
    }
    const account = await User.findById(session.user?._id).exec();
    if (!!account) {
      const esignature = await ESignature.updateOne(
        { adminId: account._id.toHexString() },
        {
          signature: eSignatureDataURL,
        },
        {
          new: true,
          upsert: false,
          runValidators: true
        }
      ).exec();
      if (esignature.acknowledged && esignature.modifiedCount > 0) {
        return {
          success: 'e-Signature saved successfully'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save e-signature'
  }
}

// export async function removeAdminSignature(employeeId: string)
// {
//   await connectDB()
//   try {
//     const session = await getSession(role)
//     if (!session) {
//       return {
//         error: 'Invalid Session'
//       }
//     }
//     if (!employeeId) {
//       return {
//         error: 'Invalid Account ID'
//       }
//     }
//     const admin = await User.findOne({ employeeId }).lean<UserDocument>().exec()
//     if (!admin) {
//       throw new Error("Admin not found")
//     }
//     const esignature = await ESignature.deleteOne({ adminId: admin._id }, { runValidators: true }).exec()
//     if (esignature.acknowledged && esignature.deletedCount > 0) {
//       return {
//         success: 'Admin signature removed successfully'
//       }
//     }
//   } catch (e) {}
//   return {
//     error: 'Failed to remove admin signature'
//   }
// }


export async function archiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $push: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}


export async function unarchiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $pull: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}

export async function forwardMemorandumLetter(memoLetterId: string, doctype: DocumentType, forwardTo: string, isIndividual: boolean = false): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const myuserFullname = session.user.fullName
      if (!memoLetterId) {
        return {
          error: 'Memo/Letter not found'
        }
      }
      if (!forwardTo) {
        return {
          error: 'Bad Request'
        }
      }
      if (doctype === DocumentType.Memo) {
        const MemoLetter = isIndividual ? MemoIndividual : Memo;
        const memo = await MemoLetter.updateOne(
          {
            _id: memoLetterId
          },
          {
            $push: { cc: forwardTo }
          }
        )
        if (memo.acknowledged && memo.modifiedCount > 0) {
          try {
            const user = await User.findById(forwardTo).lean<UserDocument>().exec();
            const href = user?.role === Roles.Admin ? '/' + user?.role + '/forwarded/memo?id=' + memoLetterId :  '/' + user?.role + '/memo?id=' + memoLetterId
            await addNotification(forwardTo, {
              title: 'A memorandum has been forwarded to you',
              message: myuserFullname + ' has forwarded a memorandum.',
              href,
            })
          } catch (e) {
            console.log(e)
          }
          return {
            success: 'Memorandum Forwarded successfully',
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const MemoLetter = isIndividual ? LetterIndividual : Letter;
        const letter = await MemoLetter.updateOne(
          {
            _id: memoLetterId
          },
          {
            $push: { cc: forwardTo }
          }
        )
        if (letter.acknowledged && letter.modifiedCount > 0) {
          try {
            const user = await User.findById(forwardTo).lean<UserDocument>().exec();
            const href = user?.role === Roles.Admin ? '/' + user?.role + '/forwarded/letter?id=' + memoLetterId :  '/' + user?.role + '/letter?id=' + memoLetterId
            await addNotification(forwardTo, {
              title: 'A letter has been forwarded to you',
              message: myuserFullname + ' has forwarded a letter.',
              href,
            })
          } catch (e) {
            console.log(e)
          }
          return {
            success: 'Letter Forwarded successfully',
          }
        }
      } else {
        return {
          error: 'Invalid document type'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}

