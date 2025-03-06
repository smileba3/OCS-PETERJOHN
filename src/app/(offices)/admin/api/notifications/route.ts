'use server';
import { Roles } from "@/lib/modelInterfaces";
import { getMyNotifications } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.pathname.split('/')[1] as Roles;
  const unreadOnly = request.nextUrl.searchParams.get('unread')
  const data = await getMyNotifications(role, unreadOnly === '1');
  if (data === null) {
    return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
  }
  return NextResponse.json({data, length: data?.length || 0})
}