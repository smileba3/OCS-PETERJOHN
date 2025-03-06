import ApprovedLetterList from "@/app/(offices)/admin/_components/approvedMemoLetters";
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}

export default function Page({ searchParams: { id }}: Params) {
  return <ApprovedLetterList doctype={DocumentType.Letter} searchParam={id} />
}