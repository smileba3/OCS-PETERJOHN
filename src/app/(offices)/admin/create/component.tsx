'use client';;
import DocumentTypePickerPage from "@/app/(offices)/_components/doctype-picker";
import { Roles } from "@/lib/modelInterfaces";

export default function CreatePageComponent() {
  return <DocumentTypePickerPage title="Create Memo/Letter" url={["/" + Roles.Admin + "/create/memo", "/" + Roles.Admin + "/create/letter"]} />
}