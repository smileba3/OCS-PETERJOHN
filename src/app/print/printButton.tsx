'use client'

import { PrintIcon } from "evergreen-ui"

export default function PrintButton() {
  return (
    <button type="button" className="print:hidden fixed top-5 right-5 px-3 py-2 bg-blue-800 text-white hover:bg-blue-500 rounded-lg" onClick={() => window.print()}><PrintIcon display="inline" /> Print</button>
  )
}