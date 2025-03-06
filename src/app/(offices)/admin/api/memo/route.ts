'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, LetterDocument, MemoDocument, Roles, SignatureApprovals, UserDocument } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
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
      const myuserid = session.user._id.toString();
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const esignature = await ESignature.findOne({ adminId: myuserid }).exec();
        if (!!esignature?._id) {
          const signature_id = esignature._id.toHexString();
          const MemoLetter = doctype === DocumentType.Memo? Memo : Letter;
          const resultFind = await MemoLetter.find({
            $or: [
              { preparedBy: myuserid, signatureApprovals: { $elemMatch: { rejectedDate: { $ne: null }, approvedDate: null }} },
              { preparedBy: myuserid, signatureApprovals: { $elemMatch: { approvedDate: null }} },
              { preparedBy: { $ne: myuserid }, signatureApprovals: { $elemMatch: { rejectedDate: { $ne: null }, approvedDate: null, signature_id }} },
              { preparedBy: { $ne: myuserid }, signatureApprovals: { $elemMatch: { approvedDate: null, signature_id }} },
              { preparedBy: { $ne: myuserid }, signatureApprovals: { $elemMatch: { approvedDate: null, rejectedDate: null, signature_id }} },
              { $and: [
                { signatureApprovals: { $elemMatch: { approvedDate: { $ne: null }, signature_id } }},
                { signatureApprovals: { $elemMatch: { approvedDate: null, signature_id: { $ne: signature_id } }}}
              ] },
            ]
          }).populate('departmentId').lean<MemoDocument[]|LetterDocument[]>().exec();
          const result = await Promise.all(resultFind.map(async (item) => {
            let prio = item.signatureApprovals.filter((s: any) => s.priority === 1 && !s.approvedDate);
            if (prio.length === 0) {
              prio = item.signatureApprovals.filter((s: any) => s.priority === 2 && !s.approvedDate);
            }
            if (prio.length === 0) {
              prio = item.signatureApprovals.filter((s: any) => s.priority === 3 && !s.approvedDate);
            }
            return {
              ...item,
              isPreparedByMe: item.preparedBy.toString() === myuserid,
              isPending: item.signatureApprovals.some((s: any) => !s.approvedDate) && ((item.preparedBy.toString() === myuserid) || (item.preparedBy.toString() !== myuserid && !!item.signatureApprovals.find((s: any) => s.signature_id == signature_id)?.approvedDate)),
              isRejected: item.signatureApprovals.some((s: any) => !!s.rejectedDate),
              nextQueue: prio.length > 0 && item.preparedBy.toString() !== myuserid && prio.some((s: any) => s.signature_id.toString() == signature_id),
              hasResponded: item.signatureApprovals.some((s: any) => s.signature_id.toString() == signature_id && (!!s.approvedDate || !!s.rejectedDate)),
              highestPosition: (session.user as UserDocument).highestPosition,
              preparedByName: (await new Promise(async (resolve) => {
                const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
                resolve(getFullName(u as UserDocument))
              })),
              signatureNames: (await Promise.all(item.signatureApprovals.map(async (sa: SignatureApprovals) => new Promise(async (resolve) => {
                const es = await ESignature.findById(sa.signature_id).select('adminId').populate('adminId').lean<ESignatureDocument>().exec()
                const r = !!es ? getFullName((es.adminId as UserDocument)) : null;
                resolve(r);
              })))).filter((sa) => !!sa),
            };
          }));
          return NextResponse.json({ result })
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}