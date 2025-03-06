'use server'

import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params: { id } }: { params: { id: string }}) {
  await connectDB()
  try {
    const doctype = request.nextUrl.searchParams.get('doctype')
    const role = request.nextUrl.searchParams.get('role')
    const isForIndividual = request.nextUrl.searchParams.get('isForIndividual') === 'true';
    const session = await getSession(role as Roles)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' })
    }
    if (isForIndividual) {
      if (doctype === DocumentType.Memo) {
        const memo = await MemoIndividual.findById(id).select('content').exec()
        if (!!memo?._id) {
          return NextResponse.json({ success: memo.content })
        }
      } else if (doctype === DocumentType.Letter) {
        const letter = await LetterIndividual.findById(id).select('content').exec()
        if (!!letter?._id) {
          return NextResponse.json({ success: letter.content })
        }
      }
    } else {
      if (doctype === DocumentType.Memo) {
        const memo = await Memo.findById(id).select('content').exec()
        if (!!memo?._id) {
          return NextResponse.json({ success: memo.content })
        }
      } else if (doctype === DocumentType.Letter) {
        const letter = await Letter.findById(id).select('content').exec()
        if (!!letter?._id) {
          return NextResponse.json({ success: letter.content })
        }
      }
    }
  } catch (e) {

  }
  return NextResponse.json({ error: 'Unauthorized' })
}