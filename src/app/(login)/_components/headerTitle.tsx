'use client'

import { usePathname } from "next/navigation"
import { useMemo } from "react"

const headerTitleMap: { [key: string]: string } = {
  "/": "ORGANIZATIONAL COMMUNICATION SYSTEM",
  "/superadmin/login": "ADMIN LOGIN",
  "/admin/login": "HEAD LOGIN",
  "/faculty/login": "FACULTY LOGIN",
}

export default function HeaderTitle() {
  const pathname = usePathname()
  const ht = useMemo(() => headerTitleMap[pathname], [pathname])
  return <>{ht}</>
}