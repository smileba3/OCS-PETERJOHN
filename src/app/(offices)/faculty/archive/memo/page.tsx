import ArchivedMemoLetter from "@/app/(offices)/faculty/_components/archivedMemoLetters";
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}

export default function Page({ searchParams: { id }}: Params) {
  return <ArchivedMemoLetter doctype={DocumentType.Memo} searchParam={id} />
}