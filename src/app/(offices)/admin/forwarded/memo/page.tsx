import ForwardedMemoLetter from "@/app/(offices)/admin/_components/forwardedMemoLetters";
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}

export default function Page({ searchParams: { id }}: Params) {
  return <ForwardedMemoLetter doctype={DocumentType.Memo} searchParam={id} />
}