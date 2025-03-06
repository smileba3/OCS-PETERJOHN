'use server';
import { AccountsColumns } from "@/app/(offices)/superadmin/_components/types";
import { PhotoFileDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const result: AccountsColumns[] = [];
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const users = await User.find({ role: Roles.Faculty })
        .select('-role -readMemos -readLetters -notification')
        .populate('departmentIds')
        .lean<UserDocument[]>()
        .exec();
      const result = await Promise.all(users.map(async (user: UserDocument) => ({...user, photo: user.photo? await PhotoFile.findById(user.photo).lean<PhotoFileDocument>().exec() : undefined })));
      return NextResponse.json({ result });
    }
  } catch (e) {}

  return NextResponse.json({ result });
}