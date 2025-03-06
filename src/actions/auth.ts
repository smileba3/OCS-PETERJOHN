'use server'

import connectDB from "@/lib/database";
import { compare } from "@/lib/hash";
import { Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { createSession, getSession } from "@/lib/session";
import {
  LoginFormSchema,
  type LoginFormState,
} from "@/lib/types";

export async function login(role: Roles, state: LoginFormState, formData: FormData): Promise<LoginFormState | undefined> {
  const validatedFields = LoginFormSchema.safeParse({
    role,
    employeeId: formData.get('employeeId'),
    password: formData.get('password'),
  })
  if (!validatedFields.success) {
    console.log(validatedFields.error)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid Credentials'
    }
  }

  await connectDB();
  try {
    let user;
    user = await User.findOne({ employeeId: validatedFields.data.employeeId, role: validatedFields.data.role }).exec();
    // No Such User/Admin
    if (!user) return { errors: { credentials: [] }, message: 'Employee ID is not registered' }
    const isPasswordCorrect = await compare(validatedFields.data.password, user.password)
    // Wrong Password
    if (!isPasswordCorrect) return { errors: { credentials: [] }, message: 'Invalid Credentials' }
    // Account Deactivated
    if (user.deactivated) return { errors: { credentials: [] }, message: 'This account has been deactivated' }
    // do session
    await createSession(role, user._id.toHexString());
  } catch (err) {
    console.log("ERROR:", err)
    return { errors: { credentials: [] }, message: 'Internal Server Error' }
  }
  return {
    success: true,
    message: 'Logged In Successfully'
  }
}


export async function fileToBuffer(file: File) {
  if (!file || !file.size) {
    return null
  }
  const arrayBuffer = await new Blob([file], { type: file.type }).arrayBuffer()
  if (!arrayBuffer) {
    return null
  }
  return Buffer.from(arrayBuffer)
}