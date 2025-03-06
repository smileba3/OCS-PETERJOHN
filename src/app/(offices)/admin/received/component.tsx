'use client';;
import DocumentTypePickerPage from "@/app/(offices)/_components/doctype-picker";
import { Roles } from "@/lib/modelInterfaces";
import { useMemo } from "react";


type Params = {
  searchParams: { id: string }
}

export default function ReceivedPageComponent({ searchParams }: Params) {
  const search = useMemo(() => new URLSearchParams(searchParams), [searchParams])
  return <DocumentTypePickerPage title="Received Memo/Letter" url={["/" + Roles.Admin + "/received/memo?" + search.toString(), "/" + Roles.Admin + "/received/letter?" + search.toString()]} />
}