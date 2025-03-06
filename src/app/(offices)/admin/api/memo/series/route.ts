'use server';
import connectDB from "@/lib/database";
import { DepartmentDocument, DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
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
      const myuserid = session.user._id.toString()
      const depid = request.nextUrl.searchParams.get('depid');
      const doctype = request.nextUrl.searchParams.get('doctype');
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);
      let dept, department_name;
      if (depid) {
        dept = await Department.findById(depid).select("name").lean<DepartmentDocument>().exec();
        department_name = dept?.name;
      }
      if (doctype === DocumentType.Memo) {
        const MemoModel = !!depid ? Memo : MemoIndividual;
        const memoSeriesLastest = await MemoModel.countDocuments({
          ...(!!depid ? {departmentId: depid} : {}),
          preparedBy: myuserid,
          createdAt: { $gte: startOfYear, $lt: endOfYear }
        }).exec();
        return NextResponse.json({
          result: memoSeriesLastest + 1,
          department_name
        })
      } else if (doctype === DocumentType.Letter) {
        const LetterModel = !!depid ? Letter : LetterIndividual;
        const letterSeriesLastest = await LetterModel.countDocuments({
          ...(!!depid ? {departmentId: depid} : {}),
          preparedBy: myuserid,
          createdAt: { $gte: startOfYear, $lt: endOfYear }
        }).exec();
        return NextResponse.json({
          result: letterSeriesLastest + 1,
          department_name
        })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}