'use server';;
import connectDB from "@/lib/database";
import { DepartmentDocument, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const departments = await Department.find({}).lean<DepartmentDocument[]>().exec();
      const result = departments.map((department: DepartmentDocument) => ({
        _id: department._id,
        name: department.name,
        memorandums: department.memoTemplates.length,
        letters: department.letterTemplates.length,
        status: department.isDissolved ? "dissolved" : "active",
      }));
      return NextResponse.json({ result });
    }
  } catch (e) {}

  return NextResponse.json({ result: [] });
}