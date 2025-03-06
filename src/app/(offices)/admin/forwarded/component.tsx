'use client';
import DocumentTypePickerPage from "@/app/(offices)/_components/doctype-picker";
import { Roles } from "@/lib/modelInterfaces";
import { useMemo } from "react";


type Params = {
  searchParams: { id: string }
}

export default function ForwardedPageComponent({ searchParams }: Params) {
  const search = useMemo(() => new URLSearchParams(searchParams), [searchParams])
  return <DocumentTypePickerPage title="Forwarded Memo/Letter" url={["/" + Roles.Admin + "/forwarded/memo?" + search.toString(), "/" + Roles.Admin + "/forwarded/letter?" + search.toString()]} />
}
