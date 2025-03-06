'use client'

import { ViewLayout } from "@/lib/types";
import clsx from "clsx";
import Image from "next/image";

function toDateString(date?: string): string {
  if (!date) {
    return ""
  }
  return (new Date(date)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ThumbnailItem({ layout, thumbnailSrc, label, createdAt, updatedAt, onClick }: { layout: ViewLayout, thumbnailSrc: string; label: string|React.ReactNode; createdAt?: Date|string|null, updatedAt?: Date|string|null, onClick: (e?: any) => void }) {
  return (<>
    {layout === "grid" && (
    <button type="button" onClick={onClick} className="text-center hover:bg-gray-400/10 p-1 rounded-lg">
      <div className="w-[61.82mm] h-[80mm] bg-white border mx-auto rounded mb-1 object-cover">
        <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
      </div>
      <div>{label}</div>
      <div>Created: {toDateString(createdAt as string|undefined)}</div>
      <div>Updated: {toDateString(updatedAt as string|undefined)}</div>
    </button>
    )}
    {layout === "list" && (
      <button type="button" onClick={onClick} className={clsx("hover:bg-gray-400/10 px-3 py-1 rounded-lg grid grid-cols-5 text-left whitespace-nowrap items-center w-full", "bg-white")}>
        <div className="font-[500] col-span-2">
          <div className={clsx("w-[20px] h-[20px] border inline-flex object-cover mr-2", "bg-white")}>
            <Image src={thumbnailSrc} className="object-cover" width={20} height={20} alt="thumbnail" />
          </div>
          <span>{label}</span>
        </div>
        <div className="text-xs text-right">{toDateString(createdAt as string|undefined)}</div>
      </button>
    )}
  </>)
}