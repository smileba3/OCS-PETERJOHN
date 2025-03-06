'use server';
import connectDB from "@/lib/database";
import { PhotoFileDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const users = await User.find({ role: Roles.Admin })
        .select('-role -readMemos -readLetters -notification')
        .populate('departmentIds')
        .lean<UserDocument[]>()
        .exec();
      const result = await Promise.all(users.map(async (user) => ({ ...user, photo: user.photo ? await PhotoFile.findById(user.photo).lean<PhotoFileDocument>().exec() : undefined, hasRegisteredSignature: (await ESignature.find({ adminId: user._id }).countDocuments().exec()) > 0 })));
      return NextResponse.json({ result });
    }
  } catch (e) {}
  return NextResponse.json({ result: [] });
}