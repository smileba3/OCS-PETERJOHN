'use client';;
import DocumentTypePickerPage from "@/app/(offices)/_components/doctype-picker";
import { Roles } from "@/lib/modelInterfaces";
import { useMemo } from "react";

type Params = {
  searchParams: { id: string, show: string }
}
export default function ApprovalsPageComponent({ searchParams }: Params) {
  const search = useMemo(() => new URLSearchParams(searchParams), [searchParams])
  return <DocumentTypePickerPage title="Memo/Letter Approvals" url={["/" + Roles.Admin + "/approvals/memo?" + search.toString(), "/" + Roles.Admin + "/approvals/letter?" + search.toString()]} />
}