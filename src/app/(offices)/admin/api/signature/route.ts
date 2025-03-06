'use server';
import connectDB from "@/lib/database";
import { ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin);
    if (!!session?.user) {
      const signatory = await ESignature.findOne({
        adminId: session.user._id
      }).lean<ESignatureDocument>().exec();
      return NextResponse.json({
        result: {
          ...(session?.user || {}),
          eSignature: signatory
        }
      })
    }
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: [] })
}