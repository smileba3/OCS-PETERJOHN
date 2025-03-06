'use server';;
import connectDB from "@/lib/database";
import { DocumentType, LetterIndividualDocument, MemoIndividualDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import LetterIndividual from "@/lib/models/LetterIndividual";
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
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const myuserid = session.user._id.toString()
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const selectFields = 'departmentIds ' + (doctype === DocumentType.Memo ? "readMemos" : "readLetters");
        const user = await User.findById(myuserid).select(selectFields).exec();
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const result2 = await MemoLetterIndividual.find({
          userId: myuserid
        }).lean<MemoIndividualDocument[]|LetterIndividualDocument[]>().exec();
        const allResult = await Promise.all(result2.map(async (item) => ({
          ...item,
          isPreparedByMe: item.preparedBy.toString() === myuserid,
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          }))
        })));
        allResult.sort((a, b) => (new Date(b.updatedAt!)).getTime() - (new Date(a.updatedAt!)).getTime())
        return NextResponse.json({ result: allResult, user })
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}