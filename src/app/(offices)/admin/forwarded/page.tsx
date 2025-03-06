import ForwardedPageComponent from "./component";

type Params = {
  searchParams: { id: string, show: string }
}
export default function Page({ searchParams }: Params) {
  return <ForwardedPageComponent searchParams={searchParams} />
}