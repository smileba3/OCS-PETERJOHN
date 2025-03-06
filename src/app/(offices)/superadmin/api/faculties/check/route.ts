'use server';;
import { DepartmentColumns } from "@/app/(offices)/superadmin/_components/types";
import { Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const result: DepartmentColumns[] = [];
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const employeeId = request.nextUrl.searchParams.get('employeeId');
      const user = await User.findOne({ employeeId }).countDocuments().exec();
      return NextResponse.json({ result: user > 0 })
    }
  } catch (e) {}

  return NextResponse.json({ result });
}