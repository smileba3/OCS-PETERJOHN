'use server';;
import { addNotification } from "@/actions/notifications";
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, Roles, SignatureApprovals } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import LetterIndividual from "@/lib/models/LetterIndividual";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const myuserid = session.user._id.toString()
      const id = request.nextUrl.searchParams.get('id');
      const doctype = request.nextUrl.searchParams.get('doctype');
      // const isForIndividual = request.nextUrl.searchParams.get('isForIndividual') === "true";
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType) && !!id) {
        const user = await User.findById(myuserid).exec();
        if (!user) {
          return NextResponse.json({ success: false, message: 'User not found' });
        }
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
          const mySig = session.user.role === Roles.Admin ? (await ESignature.findOne({ adminId: myuserid }).lean<ESignatureDocument>().exec()) : null;
          const hasSignatureNotSigned = mySig !== null && memoLetterIndividual && (memoLetterIndividual._doc.signatureApprovals as SignatureApprovals[]).some((esig) => {
            return esig.signature_id.toString() === mySig._id?.toString() && !esig.approvedDate
          });
          return NextResponse.json({
            success: true,
            hasSignatureNotSigned,
          })
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ error: true })
}