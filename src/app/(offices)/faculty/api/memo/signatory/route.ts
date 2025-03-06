'use server'

import connectDB from "@/lib/database";
import { LetterDocument, MemoDocument, Roles } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const memo = await Memo.findById(mlid).select('signatureApprovals')
        .populate('signatureApprovals.signature_id')
        .lean<MemoDocument>()
        .exec();
      if (!!memo?._id) {
        const result = memo.signatureApprovals.filter(({ approvedDate }) => !!approvedDate).map(({ signature_id, approvedDate }) => signature_id);
        return NextResponse.json({ result })
      }
      const letter = await Letter.findById(mlid).select('signatureApprovals')
        .populate('signatureApprovals.signature_id')
        .lean<LetterDocument>()
        .exec();
      if (!!letter?._id) {
        const result = letter.signatureApprovals.filter(({ approvedDate }) => !!approvedDate).map(({ signature_id, approvedDate }) => signature_id);
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}