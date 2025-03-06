'use client'

import { ActionResponseType, addUserAccount } from "@/actions/superadmin";
import { FormButton } from "@/components/forms/button";
import OCSModal from "@/components/ocsModal";
import { Roles } from "@/lib/modelInterfaces";
import { HighestPosition } from "@/lib/types";
import { toaster } from "evergreen-ui";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";

export default function AddAdminAccountModal({
  open,
  onClose = () => {},
  onRefresh = () => {}
}: Readonly<{
  open?: boolean,
  onRefresh: () => void,
  onClose: () => void,
}>) {
  const [employeeId, setEmployeeId] = useState("")
  const [loading, setLoading] = useState(false)
  const [exists, setExists] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useFormState<ActionResponseType, FormData>(addUserAccount.bind(null, Roles.Admin), {})
  useEffect(() => {
    if (!!employeeId) {
      setLoading(true)
      fetch('/' + Roles.SuperAdmin + '/api/admins/check?employeeId=' + employeeId)
        .then(response => response.json())
        .then(({ result }) => { setExists(result); setLoading(false) })
        .catch((e) => { console.log(e); setLoading(false) })
    }
  }, [employeeId])
  useEffect(() => {
    if (!pending && state.success) {
      toaster.success(state.success)
      onClose && onClose()
      onRefresh && onRefresh()
      setEmployeeId("")
      formRef.current?.reset()
    } else if (!pending && state.error) {
      toaster.danger(state.error)
    }
    // eslint-disable-next-line
  }, [state, pending])
  return (
  <OCSModal title="Add Admin Account" open={open} onClose={onClose}>
    <div className="p-4">
      <form action={action} ref={formRef} className="flex flex-col gap-y-2">
        <input type="text" name="employeeId" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="px-2 py-1 rounded bg-white border border-slate-400" required />
        {exists && <div className="text-red-500 text-xs mt-1 w-full">Employee ID already exists</div>}
        <input type="email" name="email" placeholder="Email Address" className="px-2 py-1 rounded bg-white border border-slate-400" required />
        <select name="highestPosition" className="px-2 py-1 rounded bg-white border border-slate-400" required>
          <option value="">-- Select Position --</option>
          <option value={HighestPosition.Admin}>Admin/Dean</option>
          <option value={HighestPosition.President}>President</option>
          <option value={HighestPosition.VicePresident}>Vice President</option>
        </select>
        <input type="text" name="prefixName" placeholder="Prefix Name e.g: Rev. Fr." className="px-2 py-1 rounded bg-white border border-slate-400" />
        <input type="text" name="firstName" placeholder="First Name" className="px-2 py-1 rounded bg-white border border-slate-400" required />
        <input type="text" name="middleName" placeholder="Middle Name" className="px-2 py-1 rounded bg-white border border-slate-400" />
        <input type="text" name="lastName" placeholder="Last Name" className="px-2 py-1 rounded bg-white border border-slate-400" required />
        <input type="text" name="suffixName" placeholder="Suffix Name e.g: IV, MIT" className="px-2 py-1 rounded bg-white border border-slate-400" />
        <FormButton label="Submit" disabled={exists || !employeeId || loading} className="max-w-32 mx-auto mt-4" />
      </form>
    </div>
  </OCSModal>
  )
}