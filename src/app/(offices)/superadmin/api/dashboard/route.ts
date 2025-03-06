'use server'

import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const result = {
    departmentsCount: 0,
    adminAccountsCount: 0,
    facultyAccountsCount: 0,
    eSignatureCount: 0,
    totalMemorandumsCount: 0,
    totalLettersCount: 0,
  };
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      result.departmentsCount = await Department.countDocuments().exec();
      result.adminAccountsCount = await User.find({ role: Roles.Admin }).countDocuments().exec();
      result.facultyAccountsCount = await User.find({ role: Roles.Faculty }).countDocuments().exec();
      result.eSignatureCount = await ESignature.countDocuments().exec();
      result.totalMemorandumsCount = await Memo.countDocuments().exec();
      result.totalLettersCount = await Letter.countDocuments().exec();
    }
  } catch (e) {}

  return NextResponse.json({ result });
}