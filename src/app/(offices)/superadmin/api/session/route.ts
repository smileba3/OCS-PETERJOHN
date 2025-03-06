'use server'

import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  const role = request.nextUrl.pathname.split('/')[1] as Roles;
  const data = await getSession(role);
  return NextResponse.json({ data });
}