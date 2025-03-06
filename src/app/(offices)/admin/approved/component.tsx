'use client';
import DocumentTypePickerPage from "@/app/(offices)/_components/doctype-picker";
import { Roles } from "@/lib/modelInterfaces";
import { useMemo } from "react";


type Params = {
  searchParams: { id: string }
}

export default function ApprovedPageComponent({ searchParams }: Params) {
  const search = useMemo(() => new URLSearchParams(searchParams), [searchParams])
  return <DocumentTypePickerPage title="Released Memo/Letter" url={["/" + Roles.Admin + "/approved/memo?" + search.toString(), "/" + Roles.Admin + "/approved/letter?" + search.toString()]} />
}
