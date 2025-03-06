'use client'

import { ActionResponseType, addDepartment } from "@/actions/superadmin";
import { FormButton } from "@/components/forms/button";
import OCSModal from "@/components/ocsModal";
import { Roles } from "@/lib/modelInterfaces";
import { toaster } from "evergreen-ui";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";

export default function AddDepartmentModal({
  open,
  onClose = () => {},
  onRefresh = () => {}
}: Readonly<{
  open?: boolean,
  onRefresh: () => void,
  onClose: () => void,
}>) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [exists, setExists] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useFormState<ActionResponseType, FormData>(addDepartment, {})
  useEffect(() => {
    if (!!name) {
      setLoading(true)
      fetch('/' + Roles.SuperAdmin + '/api/departments/check?name=' + name)
        .then(response => response.json())
        .then(({ result }) => { setExists(result); setLoading(false); })
        .catch((e) => { console.log(e); setLoading(false) })
    }
  }, [name])
  useEffect(() => {
    if (!pending && state.success) {
      toaster.success(state.success)
      onClose && onClose()
      onRefresh && onRefresh()
      setName("")
      formRef.current?.reset()
    } else if (!pending && state.error) {
      toaster.danger(state.error)
    }
    // eslint-disable-next-line
  }, [state, pending])
  return (
  <OCSModal title="Add Department" open={open} onClose={onClose}>
    <div className="p-4">
      <form action={action} ref={formRef} className="flex flex-col">
        <input type="text" name="name" placeholder="Department Name" value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1 rounded bg-white border border-slate-400" required />
        {exists && <div className="text-red-500 text-xs mt-1 w-full">Department already exists</div>}
        <FormButton label="Submit" disabled={exists || !name || loading} className="max-w-32 mx-auto mt-4" />
      </form>
    </div>
  </OCSModal>
  )
}