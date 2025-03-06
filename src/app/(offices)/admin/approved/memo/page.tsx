import ApprovedMemorandumList from "@/app/(offices)/admin/_components/approvedMemoLetters";
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}

export default function Page({ searchParams: { id }}: Params) {
  return <ApprovedMemorandumList doctype={DocumentType.Memo} searchParam={id} />
}