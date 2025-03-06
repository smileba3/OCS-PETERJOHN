import { useRouter } from "next/navigation"

export default function DocumentTypePickerPage({
  url,
  title,
}: {
  url: string[],
  title: string
}) {
  const router = useRouter()
  return (<div>
    <h1 className="text-4xl font-semibold px-8 py-6 border-b text-left">{title}</h1>
    <div className="min-h-[calc(100vh-300px)] w-full flex justify-evenly items-center">
      <button className="rounded bg-blue-700 text-white hover:bg-blue-200 hover:text-black h-40 w-64 text-2xl p-4" onClick={() => router.push(url[0])}>Memorandum</button>
      <button className="rounded bg-blue-700 text-white hover:bg-blue-200 hover:text-black h-40 w-64 text-2xl p-4" onClick={() => router.push(url[1])}>Letter</button>
    </div>
  </div>)
}