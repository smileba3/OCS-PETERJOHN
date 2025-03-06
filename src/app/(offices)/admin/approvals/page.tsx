import ApprovalsPageComponent from "./component";

type Params = {
  searchParams: { id: string, show: string }
}
export default function Page({ searchParams }: Params) {
  return <ApprovalsPageComponent searchParams={searchParams} />
}