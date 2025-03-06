'use server';;
import { addNotification, broadcastNotification } from "@/actions/notifications";
import connectDB from "@/lib/database";
import { DocumentType, ReadLetterDocument, ReadMemoDocument, Roles } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const id = request.nextUrl.searchParams.get('id');
      const doctype = request.nextUrl.searchParams.get('doctype');
      const isForIndividual = request.nextUrl.searchParams.get('isForIndividual') === "true";
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType) && !!id) {
        const user = await User.findById(session.user._id).exec();
        if (!user) {
          return NextResponse.json({ success: false, message: 'User not found' });
        }
        if (!!isForIndividual) {
          const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
          const memoLetterIndividual = await MemoLetterIndividual.findById(id).exec();
          if (!!memoLetterIndividual) {
            if (!memoLetterIndividual.isRead) {
              memoLetterIndividual.isRead = true;
              try {
                await memoLetterIndividual.save({ runValidators: true });
                await addNotification(memoLetterIndividual.preparedBy, {
                  title: "The " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter") + " you sent have been read.",
                  message: (user.prefixName ? user.prefixName + " " : "") + user.firstName + " " + user.lastName + (user.suffixName ? ", " + user.suffixName : "") + " has read the "
                    + (doctype === DocumentType.Memo ? "Memorandum" : "Letter") + " you have sent",
                  href: '/' + Roles.Admin + '/approved/' + (doctype === DocumentType.Memo ? "memo" : "letter") + '?id=' + memoLetterIndividual._id.toHexString(),
                });
              } catch (err) {
                console.log("ERROR:", err);
              }
            }
          }
        } else {
          const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
          const memoletter = await MemoLetter.findById(id).exec();
          if (!!memoletter) {
            if (doctype === DocumentType.Memo) {
              if (![...user.readMemos].map((v: ReadMemoDocument) => v.memoId?.toString()).includes(memoletter._id.toString())) {
                user.readMemos.push({ memoId: memoletter._id });
                await user.save({ runValidators: true });
                await broadcastNotification({
                  role: Roles.Admin,
                  departmentId: memoletter.departmentId.toString(),
                  title: "A Faculty Read the " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter"),
                  message: (user.prefixName ? user.prefixName + " " : "") + user.firstName + " " + user.lastName + (user.suffixName ? ", " + user.suffixName : "") +
                    " has read the " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter"),
                  href: '/' + Roles.Admin + '/approved/' + (doctype === DocumentType.Memo ? "memo" : "letter") + '?id=' + memoletter._id.toHexString(),
                })
              }
            } else {
              if (![...user.readLetters].map((v: ReadLetterDocument) => v.letterId?.toString()).includes(memoletter._id.toString())) {
                user.readLetters.push({ letterId: memoletter._id });
                await user.save({ runValidators: true });
                await broadcastNotification({
                  role: Roles.Admin,
                  departmentId: memoletter.departmentId.toString(),
                  title: "A Faculty Read the " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter"),
                  message: (user.prefixName ? user.prefixName + " " : "") + user.firstName + " " + user.lastName + (user.suffixName ? ", " + user.suffixName : "") +
                    " has read the " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter"),
                  href: '/' + Roles.Admin + '/approved/' + (doctype === DocumentType.Memo ? "memo" : "letter") + '?id=' + memoletter._id.toHexString(),
                })
              }
            }
            return NextResponse.json({ success: true });
          }
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ error: true })
}