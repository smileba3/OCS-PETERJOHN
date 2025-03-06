'use server'

import connectDB from "@/lib/database";
import { ESignatureDocument, LetterIndividualDocument, MemoIndividualDocument, Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const isForIndividual = request.nextUrl.searchParams.get('isForIndividual') === 'true';
      if (isForIndividual) {
        const memo = await MemoIndividual.findById(mlid).select('preparedBy').lean<MemoIndividualDocument>().exec();
        if (!!memo) {
          const result = await ESignature.findOne({ adminId: memo.preparedBy.toString() }).lean<ESignatureDocument>().exec();
          return NextResponse.json({ result })
        }
        const letter = await LetterIndividual.findById(mlid).select('preparedBy').lean<LetterIndividualDocument>().exec();
        if (!!letter) {
          const result = await ESignature.findOne({ adminId: letter.preparedBy }).lean<ESignatureDocument>().exec();
          return NextResponse.json({ result })
        }
      } else {
        const memo = await Memo.findById(mlid).select('preparedBy').exec();
        if (!!memo) {
          const result = await ESignature.findOne({ adminId: memo.preparedBy }).lean<ESignatureDocument>().exec();
          return NextResponse.json({ result })
        }
        const letter = await Letter.findById(mlid).select('preparedBy').populate('signatureApprovals.signature_id').exec();
        if (!!letter) {
          const result = await ESignature.findOne({ adminId: letter.preparedBy }).lean<ESignatureDocument>().exec();
          return NextResponse.json({ result })
        }
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}