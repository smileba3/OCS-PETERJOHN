'use server';;
import connectDB from "@/lib/database";
import { DepartmentDocument, ESignatureDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { HighestPosition } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const departments = await Department.find({}).select('name').lean<DepartmentDocument[]>().exec()
      const result: {
        [dept: string]: {
          department: {
            _id?: string,
            name: string
          },
          users: (UserDocument & { signatureId: string|null })[]
        }
      } = {}
      for (const department of departments) {
        const users = await User.find({ departmentIds: { $in: [department!._id] }, highestPosition: { $nin: [HighestPosition.President, HighestPosition.VicePresident] }}).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').lean<UserDocument[]>().exec()
        const allUsers: (UserDocument & { signatureId: string|null })[] = await Promise.all(users.map(async (user: UserDocument) => ({
          ...user,
          signatureId: (await ESignature.findOne({ adminId: user?._id }).select('signature').lean<ESignatureDocument>().exec())?._id || null
        })))
        const deptId: string = department._id!.toString()
        result[deptId] = {
          department,
          users: allUsers
        }
      }
      const president = await User.findOne({ highestPosition: HighestPosition.President }).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').lean<UserDocument>().exec()
      const vp = await User.findOne({ highestPosition: HighestPosition.VicePresident }).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').lean<UserDocument>().exec()
      if (!!president) {
        result[president.highestPosition] = {
          department: {
            name: president.highestPosition,
          },
          users: [{
            ...president,
            signatureId: (await ESignature.findOne({ adminId: president!._id }).select('signature').lean<ESignatureDocument>().exec())?._id || null
          }]
        }
      }
      if (!!vp) {
        result[vp.highestPosition] = {
          department: {
            name: vp.highestPosition,
          },
          users: [{
            ...vp,
            signatureId: (await ESignature.findOne({ adminId: vp!._id }).select('signature').lean<ESignatureDocument>().exec())?._id || null
          }]
        }
      }
      return NextResponse.json({ result })
    }
  } catch (e) {}
  return NextResponse.json({ result: {} })
}