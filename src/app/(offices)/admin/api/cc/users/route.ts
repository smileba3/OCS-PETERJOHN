'use server';;
import connectDB from "@/lib/database";
import { Roles, UserDocument } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin);
    if (!!session?.user) {
      const result = await User.find({ role: { $in: [Roles.Admin, Roles.Faculty] }}).select('employeeId prefixName firstName middleName lastName suffixName').lean<UserDocument[]>().exec()
      return NextResponse.json({ result })
    }
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: [] })
}