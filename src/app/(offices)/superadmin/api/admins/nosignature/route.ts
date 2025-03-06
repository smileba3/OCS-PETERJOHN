'use server'

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
      const user = await User.aggregate([
        {
          $match: { role: Roles.Admin, deactivated: false },
        },
        {
          $lookup: {
            from: 'esignatures',
            localField: '_id',
            foreignField: 'adminId',
            as: 'esignature'
          }
        },
        {
          $project: {
            _id: 1,
            employeeId: 1,
            prefixName: 1,
            firstName: 1,
            middleName: 1,
            lastName: 1,
            suffixName: 1,
            photo: 1,
            hasRegisteredSignature: { $and: [{ $not: null }, { $gt: [ { $size: "$esignature" }, 0 ] }] }
          },
        },
        {
          $match: { hasRegisteredSignature: false }
        }
      ]);
      const result = await Promise.all(user.map(async (u: UserDocument) => ({ ...JSON.parse(JSON.stringify(u)), photo: u.photo ? await PhotoFile.findById(u.photo).lean<PhotoFileDocument>().exec() : undefined })));
      return NextResponse.json({ result });
    }
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: [] });
}