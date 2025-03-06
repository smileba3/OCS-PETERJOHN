'use client';
import { ActionResponseType, updateAccount } from "@/actions/superadmin";
import { FormButton } from "@/components/forms/button";
import OCSModal from "@/components/ocsModal";
import { HighestPosition } from "@/lib/types";
import { toaster } from "evergreen-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { AccountsColumns } from "./types";

export default function UpdateAccountModal({
  oldData,
  open,
  onClose = () => {},
  onRefresh = () => {},
  isFaculty = false,
}: Readonly<{
  oldData: AccountsColumns|undefined,
  open?: boolean,
  onRefresh: () => void,
  onClose: () => void,
  isFaculty?: boolean
}>) {
  const [data, setData] = useState<AccountsColumns|undefined>(oldData)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useFormState<ActionResponseType, FormData>(updateAccount.bind(null, oldData?._id), {})

  const onModalClose = useCallback(() => {
    onClose && onClose()
  }, [onClose])

  useEffect(() => {
    setData(oldData)
  }, [oldData])

  useEffect(() => {
    if (!pending && state.success) {
      toaster.success(state.success)
      onModalClose()
      onRefresh && onRefresh()
      formRef.current?.reset()
    } else if (!pending && state.error) {
      toaster.danger(state.error)
    }
    // eslint-disable-next-line
  }, [state, pending])

  return (
    <OCSModal title="Update Account" open={open} onClose={onModalClose}>
      <div className="p-4">
        <form action={action} ref={formRef} className="flex flex-col gap-y-2">
          <input type="email" name="email" placeholder="Email Address" value={data?.email} onChange={(e) => setData({ ...data as AccountsColumns, email: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" required />
          {!isFaculty && (
            <select name="highestPosition" className="px-2 py-1 rounded bg-white border border-slate-400" value={data?.highestPosition} onChange={(e) => setData({ ...data as AccountsColumns, highestPosition: e.target.value as HighestPosition })} required>
              <option value="">-- Select Position --</option>
              <option value={HighestPosition.Admin}>Admin/Dean</option>
              <option value={HighestPosition.President}>President</option>
              <option value={HighestPosition.VicePresident}>Vice President</option>
            </select>
          )}
          <input type="text" name="prefixName" placeholder="Prefix Name e.g: Rev. Fr." value={data?.prefixName} onChange={(e) => setData({ ...data as AccountsColumns, prefixName: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" />
          <input type="text" name="firstName" placeholder="First Name" value={data?.firstName} onChange={(e) => setData({ ...data as AccountsColumns, firstName: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" required />
          <input type="text" name="middleName" placeholder="Middle Name" value={data?.middleName} onChange={(e) => setData({ ...data as AccountsColumns, middleName: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" />
          <input type="text" name="lastName" placeholder="Last Name" value={data?.lastName} onChange={(e) => setData({ ...data as AccountsColumns, lastName: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" required />
          <input type="text" name="suffixName" placeholder="Suffix Name e.g: IV, MIT" value={data?.suffixName} onChange={(e) => setData({ ...data as AccountsColumns, suffixName: e.target.value })} className="px-2 py-1 rounded bg-white border border-slate-400" />
          <FormButton label="Submit" className="max-w-32 mx-auto mt-4" />
        </form>
      </div>
    </OCSModal>
  )
}