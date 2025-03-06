'use server';
import connectDB from "@/lib/database";
import { PhotoFileDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const result = await User.findOne({ _id: session.user._id })
        .select('-password -departmentIds -readMemos -readLetters -deactivated -notification')
        .lean<UserDocument>()
        .exec()
      if (!!result) {
        result.photo = !!result.photo ? await PhotoFile.findById(result.photo).lean<PhotoFileDocument>().exec() : null;
      }
      return NextResponse.json({ result })
    }
  } catch (e) {}
  return NextResponse.json({ result: {} })
}