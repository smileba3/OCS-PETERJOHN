'use server';
import connectDB from "@/lib/database";
import { Roles, TemplateDocument } from "@/lib/modelInterfaces";
import Template from "@/lib/models/Template";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.Admin);
    if (!!session?.user) {
      const result = await Template.find({ isForIndividual: true }).lean<TemplateDocument[]>().exec()
      return NextResponse.json({ result });
    }
  } catch (e) {
    console.log("error", e)
  }

  return NextResponse.json({ result: [] });
}