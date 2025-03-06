'use server';;
import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const employeeId = request.nextUrl.searchParams.get('employeeId');
      const user = await User.findOne({ employeeId }).countDocuments().exec();
      return NextResponse.json({ result: user > 0 })
    }
  } catch (e) {}

  return NextResponse.json({ result: false }, { status: 401 });
}