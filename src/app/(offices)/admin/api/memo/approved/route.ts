'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles, SignatureApprovals, UserDocument } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { HighestPosition } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const myuserid = session?.user._id.toString();
      const doctype = request.nextUrl.searchParams.get('doctype');
      const populate = request.nextUrl.searchParams.get('populate');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const memoLetterField = doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters";
        const memoLetterIndividualField = doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals";
        const user = await User.findById(myuserid).select(`departmentIds ${memoLetterField} ${memoLetterIndividualField}`).exec();
        const signature = await ESignature.findOne({ adminId: myuserid }).select('_id').exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const signature_id = signature?._id?.toHexString();
        let departments = await Department.find({}).select('_id').exec();
        const departmentIds = departments.map((dp) => dp._id?.toHexString())
        let populate_args = 'departmentId';
        if (!!populate) {
          populate_args += ` ${populate.replaceAll(","," ")}`;
        }
        const resultFind = await MemoLetter.find({
          $or: [
            {
              $and: [
                {
                  _id: {
                    $nin: [...((user as any)[memoLetterField] || [])]
                  }
                },
                {
                  departmentId: {
                    $nin: (user as any).departmentIds,
                  },
                },
                {
                  signatureApprovals: {
                    $elemMatch: { signature_id: signature_id },
                  }
                },
                {
                  signatureApprovals: {
                    $not: {
                      $all: {
                        $elemMatch: { approvedDate: null },
                      },
                    },
                  },
                },
                {
                  signatureApprovals: {
                    $all: {
                      $elemMatch: { rejectedDate: null },
                    }
                  }
                }
              ],
            },
            {
              $and: [
                {
                  _id: {
                    $nin: [...((user as any)[memoLetterField] || [])]
                  }
                },
                {
                  departmentId: {
                    $in: (user as any).highestPosition === HighestPosition.Admin ? (user as any).departmentIds : departmentIds,
                  },
                },
                {
                  signatureApprovals: {
                    $not: {
                      $all: {
                        $elemMatch: { approvedDate: null },
                      },
                    },
                  },
                },
                {
                  signatureApprovals: {
                    $all: {
                      $elemMatch: { rejectedDate: null },
                    }
                  }
                }
              ],
            }
          ]
        }).populate(populate_args).lean<MemoDocument[]|LetterDocument[]>().exec();
        const resultFindIndividual = await MemoLetterIndividual.find({
          _id: {
            $nin: [...((user as any)[memoLetterIndividualField] || [])]
          },
          userId: {
            $ne: myuserid,
          },
          preparedBy: myuserid,
        }).lean<MemoIndividualDocument[]|LetterIndividualDocument[]>().exec();
        const departmentalMemoLetter = await Promise.all(resultFind.map(async (item, i) => ({
          ...item,
          isPreparedByMe: item.preparedBy.toString() === myuserid,
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          })),
          signatureNames: (await Promise.all(item.signatureApprovals.map(async (sa: SignatureApprovals) => new Promise(async (resolve) => {
            const es = await ESignature.findById(sa.signature_id).select('adminId').populate('adminId').lean<ESignatureDocument>().exec()
            const r = !!es ? getFullName((es.adminId as UserDocument)) : null;
            resolve(r);
          })))).filter((sa) => !!sa),
        })))
        const individualMemoLetter = await Promise.all(
          resultFindIndividual.map(async (item) => ({
            ...item,
            isPreparedByMe: item.preparedBy.toString() === myuserid,
            preparedByName: (await new Promise(async (resolve) => {
              const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
              resolve(getFullName(u as UserDocument))
            })),
            signatureNames: (await Promise.all([
              ...[item.userId].map(async (uid) => new Promise(async (resolve) => {
                const u = await User.findById(uid).lean<UserDocument>().exec();
                resolve(getFullName(u as UserDocument))
              })),
              ...item.signatureApprovals.map(async (sa: SignatureApprovals) => new Promise(async (resolve) => {
                const es = await ESignature.findById(sa.signature_id).select('adminId').populate('adminId').lean<ESignatureDocument>().exec()
                const r = !!es ? getFullName((es.adminId as UserDocument)) : null;
                resolve(r);
              }))
            ])).reduce((caller: any[], sa: any) => !!sa && !caller.includes(sa) ? [...caller, sa] : caller, []),
          }))
        )
        return NextResponse.json({
          result: {
            departments: departmentalMemoLetter,
            individuals: individualMemoLetter,
          }
        })
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}