import { DocumentType, Roles } from "@/lib/modelInterfaces";
import { isObjectIdOrHexString } from "mongoose";
import { Metadata } from "next";
import Print from "./printPreview";

interface ReportsFilter {
  rfrom?: string
  rto?: string
  rfilter?: "days"|"months"|"years"
  series?: string
  senders?: string
  departments?: string
}

type Params = {
  searchParams: {
    doc: string|DocumentType
    role: string|Roles,
    id: string,
    title: string,
    isForIndividual?: string,
    type?: "attendance"|"report"
  } & ReportsFilter
}

export const metadata: Metadata = {
  title: 'Print Preview'
}

export default async function Page({ searchParams: { role, id, doc, title, isForIndividual, type, ...filters } }: Params) {
  if ([Roles.Admin, Roles.Faculty, Roles.SuperAdmin].includes(role as Roles) && [DocumentType.Letter, DocumentType.Memo].includes(doc as DocumentType) && (type === "report" || isObjectIdOrHexString(id))) {
    return <Print role={role as Roles} id={id} doctype={doc} title={title} isForIndividual={isForIndividual === 'true'} isAttendance={type === "attendance"} isReport={type === "report"} filters={filters}/>
  }
  return <div className="min-h-screen w-full">Invalid</div>
}