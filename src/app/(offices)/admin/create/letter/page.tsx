import CreateMemoLetterFromTemplate from "@/app/(offices)/admin/_components/createMemoLetter";
import { DocumentType } from "@/lib/modelInterfaces";

export default function Page() {
  return <CreateMemoLetterFromTemplate doctype={DocumentType.Letter} />
}
