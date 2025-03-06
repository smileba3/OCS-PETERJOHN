import ApprovedMemoLettersReceive from "@/app/(offices)/admin/_components/approvedMemoLettersReceive";
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}

export default function Page({ searchParams: { id }}: Params) {
  return <ApprovedMemoLettersReceive doctype={DocumentType.Memo} searchParam={id} />
}