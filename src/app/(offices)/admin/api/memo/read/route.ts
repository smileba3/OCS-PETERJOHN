'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ReadLetterDocument, ReadMemoDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const id = request.nextUrl.searchParams.get('id');
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType) && !!id) {
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const memoletter = await MemoLetter.findById(id).exec();
        if (!!memoletter) {
          const filterName = doctype === DocumentType.Memo ? "readMemos" : "readLetters";
          const memoletterId = doctype === DocumentType.Memo ? "memoId" : "letterId";
          const faculties = await User.find({
            role: Roles.Faculty,
            [filterName]: { $elemMatch: { [memoletterId]: id.toString() } }
          }).select('-password -notification').lean<UserDocument[]>();
          const mapped = faculties.map((f: UserDocument) => ({
            ...f,
            readAt: f[filterName]?.find((ml: ReadMemoDocument|ReadLetterDocument) => doctype === DocumentType.Memo
              ? (ml as ReadMemoDocument).memoId?.toString() === id.toString()
              : (ml as ReadLetterDocument).letterId?.toString() === id.toString()
            )?.createdAt,
            readMemos: undefined,
            readLetters: undefined
          }))
          return NextResponse.json({ data: mapped });
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ data: [] })
}