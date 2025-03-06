'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles, SignatureApprovals, UserDocument } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const selectFields = 'departmentIds ' + (doctype === DocumentType.Memo ? "readMemos" : "readLetters");
        const user = await User.findById(session.user._id).select(selectFields).lean<UserDocument>().exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const userId = user?._id?.toString();
        const result = await MemoLetter.find({
          $and: [
            {
              $or: [
                {
                  departmentId: {
                    $in: user!.departmentIds,
                  },
                },
                {
                  cc: {
                    $in: [userId]
                  },
                }
              ]
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
          ]
        }).populate('departmentId').lean<MemoDocument[]|LetterDocument[]>().exec();
        const result2 = await MemoLetterIndividual.find({
          $or: [
            {
              userId
            },
            {
              cc: {
                $in: [userId]
              }
            }
          ]
        }).lean<MemoIndividualDocument[]|LetterIndividualDocument[]>().exec();
        const allResult1 = await Promise.all(result.map(async (item) => ({
          ...item,
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          })),
          signatureNames: (await Promise.all(item.signatureApprovals.map(async (sa: SignatureApprovals) => new Promise(async (resolve) => {
            const es = await ESignature.findById(sa.signature_id).select('adminId').populate('adminId').lean<ESignatureDocument>().exec()
            const r = !!es ? getFullName((es.adminId as UserDocument)) : null;
            resolve(r);
          })))).filter((sa) => !!sa),
        })));
        const allResult2 = await Promise.all(result2.map(async (item) => ({
          ...item,
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          }))
        })))
        const allResult = [...allResult1, ...allResult2];
        allResult.sort((a, b) => (new Date((b as any).updatedAt)).getTime() - (new Date((a as any).updatedAt)).getTime())
        return NextResponse.json({ result: allResult, user })
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}