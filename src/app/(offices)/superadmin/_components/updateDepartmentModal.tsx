'use client'

import { ActionResponseType, updateDepartment } from "@/actions/superadmin";
import { FormButton } from "@/components/forms/button";
import OCSModal from "@/components/ocsModal";
import { Roles } from "@/lib/modelInterfaces";
import { toaster } from "evergreen-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { DepartmentColumns } from "./types";

export default function UpdateDepartmentModal({
  oldData,
  open,
  onClose = () => {},
  onRefresh = () => {}
}: Readonly<{
  oldData: DepartmentColumns|undefined,
  open?: boolean,
  onRefresh: () => void,
  onClose: () => void,
}>) {
  const [name, setName] = useState<string|undefined>()
  const [loading, setLoading] = useState(false)
  const [exists, setExists] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useFormState<ActionResponseType, FormData>(updateDepartment.bind(null, oldData?._id), {})

  const onModalClose = useCallback(() => {
    onClose && onClose()
  }, [onClose])

  useEffect(() => {
    setName(oldData?.name)
  }, [oldData])

  useEffect(() => {
    if (!!name && name !== oldData?.name) {
      setLoading(true)
      fetch('/' + Roles.SuperAdmin + '/api/departments/check?name=' + name)
        .then(response => response.json())
        .then(({ result }) => { setExists(result); setLoading(false); })
        .catch((e) => { console.log(e); setLoading(false) })
    } else if (name === oldData) {
      setExists(false)
      setLoading(true)
    }
  }, [name, oldData])

  useEffect(() => {
    if (!pending && state.success) {
      toaster.success(state.success)
      onModalClose()
      onRefresh && onRefresh()
      setName("")
      formRef.current?.reset()
    } else if (!pending && state.error) {
      toaster.danger(state.error)
    }
    // eslint-disable-next-line
  }, [state, pending])

  return (
    <OCSModal title="Update Department" open={open} onClose={onModalClose}>
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