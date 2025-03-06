'use server'

import { Roles } from "@/lib/modelInterfaces";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.pathname.split('/')[1] as Roles;
  const data = await getSession(role);
  return NextResponse.json({ data });
}