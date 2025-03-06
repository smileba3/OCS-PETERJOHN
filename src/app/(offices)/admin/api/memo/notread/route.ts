'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles, UserDocument } from "@/lib/modelInterfaces";
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
          const memoDepartment = memoletter.departmentId?.toString();
          const filterName = doctype === DocumentType.Memo ? "readMemos" : "readLetters";
          const memoletterId = doctype === DocumentType.Memo ? "memoId" : "letterId";
          const faculties = await User.find({
            role: Roles.Faculty,
            departmentIds: { $in: [memoDepartment] },
            [filterName]: { $not: { $elemMatch: { [memoletterId]: id.toString() } } }
          }).select('-password -readMemos -readLetters -notification').lean<UserDocument[]>();
          return NextResponse.json({ data: faculties });
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ data: [] })
}