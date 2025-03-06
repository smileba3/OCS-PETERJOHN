'use server';
import connectDB from "@/lib/database";
import { ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const result = await ESignature.find({}).populate('adminId').lean<ESignatureDocument[]>().exec();
      return NextResponse.json({ result })
    }
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: [] })
}