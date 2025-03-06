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
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const memo = await Memo.findById(mlid).select('signatureApprovals')
        .populate('signatureApprovals.signature_id')
        .lean<MemoDocument>()
        .exec();
      if (!!memo) {
        const result = memo.signatureApprovals.map(({ approvedDate }) => !!approvedDate);
        return NextResponse.json({ result })
      }
      const letter = await Letter.findById(mlid)
        .select('signatureApprovals')
        .populate('signatureApprovals.signature_id')
        .lean<LetterDocument>()
        .exec();
      if (!!letter) {
        const result = letter.signatureApprovals.map(({ approvedDate }) => !!approvedDate);
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}