import MemorandumInbox from '@/app/(offices)/admin/_components/memoLetterInbox';
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string, show: string }
}
export default function Page({ searchParams: { id, show }}: Params) {
  return <MemorandumInbox doctype={DocumentType.Memo} searchParam={id} showRejected={show === 'rejected'} />
}