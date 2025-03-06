'use server';
import connectDB from "@/lib/database";
import { ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const id =  request.nextUrl.searchParams.get('id');
      const users = await User.findOne({ _id: id, role: Roles.Admin }).select('-role -readMemos -readLetters -notification').exec();
      if (!!users) {
        const result = await ESignature.findOne({ adminId: id }).lean<ESignatureDocument>().exec();
        return NextResponse.json({ result });
      }
    }
  } catch (e) {}
  return NextResponse.json({ result: [] });
}