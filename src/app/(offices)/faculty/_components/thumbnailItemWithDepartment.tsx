'use client';
import { ViewLayout } from "@/lib/types";
import clsx from "clsx";
import Image from "next/image";

function toDateString(date?: string): string {
  if (!date) {
    return ""
  }
  return (new Date(date)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ThumbnailItemWithDepartment({ withSignatureNames, isPreparedBy, layout, series, thumbnailSrc, department, label, createdAt, updatedAt, isRejected, preparedByMe, isPending, onClick, isRead }: { withSignatureNames?: string[], isPreparedBy: string, layout: ViewLayout, series?: string, thumbnailSrc: string; department: string; label: string|React.ReactNode; createdAt?: Date|string|null, updatedAt?: Date|string|null, isRejected?: boolean, preparedByMe?: boolean, isPending?: boolean, onClick: (e?: any) => void, isRead?: boolean }) {
  return (<>
    {layout === "grid" && (
      <button type="button" onClick={onClick} className={clsx("text-center hover:bg-gray-400/10 p-1 rounded-lg", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : isRead ? "bg-green-100 hover:bg-green-300" : "bg-white")}>
      <div className={clsx("w-[61.82mm] h-[80mm] border mx-auto rounded mb-1 object-cover", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
        <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
      </div>
      <div className="font-[500]">{label}</div>
      <div className="italic">{department}</div>
      {!!series && (<div className="italic">Series: {series}</div>)}
      <div className="italic">Prepared By: {isPreparedBy}</div>
      {!!withSignatureNames && <div className="w-full h-fit">Approvals ({withSignatureNames.length})</div>}
      <div>Created: {toDateString(createdAt as string|undefined)}</div>
    </button>
    )}
    {layout === "list" && (
      <button type="button" onClick={onClick} className={clsx("*:h-full break-all hover:bg-gray-400/10 px-3 py-1 rounded-lg grid text-left items-center w-full", withSignatureNames ? "grid-cols-6" : "grid-cols-5", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : "bg-white")}>
        <div className="font-[500] flex items-center">
          <div className="h-fit w-full">
            <div className={clsx("w-[20px] h-[20px] border inline-flex object-cover mr-2", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
              <Image src={thumbnailSrc} className="object-cover" width={20} height={20} alt="thumbnail" />
            </div>
            <span>{label}</span>
          </div>
        </div>
        <div className="italic text-xs border-x px-1 flex items-center"><div className="h-fit w-full">Prepared By: <div>{isPreparedBy}</div></div></div>
        {withSignatureNames && <div className="italic text-xs border-r px-1 flex items-center"><div className="w-full h-fit">Received: ({withSignatureNames.length})
          {withSignatureNames.map((wsn, i) => <div key={wsn + "_" + i}>{wsn}</div>)}</div></div>}
        <div className="italic text-center border-r px-1 flex items-center"><div className="h-fit w-full">{department || "For Individual"}</div></div>
        {!!series && (<div className="italic text-xs border-r px-1 flex items-center"><div className="h-fit w-full">Series: <div>{series}</div></div></div>)}
        <div className="text-xs text-right px-1 flex items-center"><div className="h-fit w-full">{toDateString(createdAt as string|undefined)}</div></div>
      </button>
    )}
    {/* {layout === "list" && (
      <button type="button" onClick={onClick} className={clsx("break-all hover:bg-gray-400/10 px-3 py-1 rounded-lg grid grid-cols-5 text-left items-center w-full", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : "bg-white")}>
        <div className="font-[500] col-span-2">
          <div className={clsx("w-[20px] h-[20px] border inline-flex object-cover mr-2", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
            <Image src={thumbnailSrc} className="object-cover" width={20} height={20} alt="thumbnail" />
          </div>
          <span>{label}</span>
        </div>
        <div className="italic text-xs">Prepared By: {isPreparedBy}</div>
        <div className="italic">{department}</div>
        {!!series && (<div className="italic text-xs">Series: {series}</div>)}
        <div className="text-xs text-right">{toDateString(createdAt as string|undefined)}</div>
      </button>
    )} */}
  </>)
}