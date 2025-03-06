'use client'

import { ActionResponseType, addAccountDepartment } from "@/actions/superadmin";
import { FormButton } from "@/components/forms/button";
import OCSModal from "@/components/ocsModal";
import { DepartmentDocument, Roles } from "@/lib/modelInterfaces";
import { toaster } from "evergreen-ui";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";

export default function AddFacultyDepartmentModal({
  id,
  departments,
  open,
  onClose = () => {},
  onRefresh = () => {}
}: Readonly<{
  id?: string|null,
  departments?: string[],
  open?: boolean,
  onRefresh: () => void,
  onClose: () => void,
}>) {
  const [allDepartments, setAllDepartments] = useState<DepartmentDocument[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useFormState<ActionResponseType, FormData>(addAccountDepartment.bind(null, id as string), {})

  useEffect(() => {
    fetch('/' + Roles.SuperAdmin + '/api/departments')
      .then((response) => response.json())
      .then(({ result }) => setAllDepartments(result))
      .catch(console.log)
  }, [])

  useEffect(() => {
    if (!pending && state.success) {
      toaster.success(state.success)
      onClose && onClose()
      onRefresh && onRefresh()
      formRef.current?.reset()
    } else if (!pending && state.error) {
      toaster.danger(state.error)
    }
    // eslint-disable-next-line
  }, [state, pending])

  return (
    <OCSModal title="Add Faculty Department" open={open} onClose={onClose}>
      <div className="p-4">
        <form action={action} ref={formRef} className="flex flex-col">
          { id && (
            <div className="w-full border rounded p-2">
              { departments?.map((department: string, i: number) => (
                <div key={"dept" + i} className="">
                  {i + 1} - {department}
                </div>
              ))}
            </div>
          )}
          <select name="departmentId" className="px-2 py-1 rounded bg-white border border-slate-400" required>
            { allDepartments.filter((department) => !departments?.includes(department.name)).map((department: DepartmentDocument, i: number) => (
              <option key={"dept" + i} value={department._id}>{department.name}</option>
            ))}
          </select>
          <FormButton label="Submit" className="max-w-32 mx-auto mt-4" />
        </form>
      </div>
    </OCSModal>
  )
}