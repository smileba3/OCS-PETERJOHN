'use client'

import Link from "next/link"

export default function MainComponent() {
  return (
    <div className="grid grid-cols-1 grid-rows-3 h-full items-center text-white px-16">
      <Link href="/superadmin/login" className="w-full mx-auto px-6 py-2 bg-[#004aad] rounded-full shadow">
        Admin
      </Link>
      <Link href="/admin/login" className="w-full mx-auto px-6 py-2 bg-[#004aad] rounded-full shadow">
        Head
      </Link>
      <Link href="/faculty/login" className="w-full mx-auto px-6 py-2 bg-[#004aad] rounded-full shadow">
        Faculty
      </Link>
    </div>
  )
}