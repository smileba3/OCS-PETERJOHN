'use client';;
import { dissolveDepartment } from "@/actions/superadmin";
import OCSTable from "@/components/table";
import { Roles } from "@/lib/modelInterfaces";
import type { TableColumnProps } from "@/lib/types";
import clsx from "clsx";
import { EditIcon, PlusIcon, RefreshIcon, RemoveIcon, toaster } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AddDepartmentModal from "./addDepartmentModal";
import type { DepartmentColumns } from './types';
import UpdateDepartmentModal from "./updateDepartmentModal";

function getDepartmentColumns({ onUpdate, onDissolve }: Readonly<{ onUpdate: (id: string) => void, onDissolve: (id: string) => void }>): TableColumnProps[]
{
  return [
    {
      label: "Department Name", field: "name", sortable: true, searchable: true,
    },
    {
      label: "Memorandums", field: "memorandums", sortable: true, align: 'center', searchable: true,
    },
    {
      label: "Letters", field: "letters", sortable: true, align: 'center', searchable: true,
    },
    {
      label: "Status", field: "status", sortable: true, align: 'center', searchable: true,
      render: (row: DepartmentColumns) => (
        <div className={
          clsx(
            "captitalize p-2 rounded-full max-w-32 mx-auto text-center",
            row.status === "active" && "bg-green-500 text-green-900 font-[700]",
            row.status === "dissolved" && "bg-gray-400 text-white",
          )}
        >
          {row.status}
        </div>
      ),
    },
    {
      label: "Action", field: "actions", align: "center",
      render: (row: DepartmentColumns) => (
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => onUpdate(row._id)} title="Edit">
            <EditIcon />
          </button>
          <button type="button" onClick={() => onDissolve(row._id)} title="Dissolve" className="text-red-500">
            <RemoveIcon />
          </button>
        </div>
      )
    },
  ]
}

async function getData(setData: (data: DepartmentColumns[]) => void, setLoading: (loading: boolean) => void) {
  setLoading(true)
  try {
    const response = await fetch('/' + Roles.SuperAdmin + '/api/departments')
    const { result } = await response.json();
    setData(result)
    setLoading(false)
  } catch (e) {
    console.log(e)
    setLoading(false)
  }
}

export default function DepartmentsPage() {
  const [data, setData] = useState<DepartmentColumns[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState("");
  const selectedDepartmentName = useMemo(() => data.find((d) => d._id == selectedUpdateId), [data, selectedUpdateId]);

  const onUpdate = useCallback((id: string) => {
    setSelectedUpdateId(id);
  }, []);

  const onDissolve = useCallback((id: string) => {
    const deptName = data.find((d) => d._id == selectedUpdateId)?.name
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure you want to dissolve this department?',
      text: deptName,
      showCancelButton: true,
      confirmButtonColor: '#d65130',
    })
      .then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          const dissolve = dissolveDepartment.bind(null, id)
          const { success, error } = await dissolve()
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            setTimeout(() => getData(setData, setLoading), 500)
          }
        }
      })
  }, [data, selectedUpdateId]);

  const departmentColumns = getDepartmentColumns({
    onUpdate,
    onDissolve,
  });

  useEffect(() => {
    getData(setData, setLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-8 py-4">
      <h1 className="text-[25px] font-[600] mb-4">Departments</h1>
      <OCSTable loading={loading} columns={departmentColumns} data={data} searchable toolbars={[
        (<div key={"deptoolbar1"} className="flex flex-nowrap gap-x-2 justify-end items-center">
          <button type="button" onClick={() => setOpen(true)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><PlusIcon display="inline" marginRight={4} size={12} />Add Department</button>
          <button type="button" onClick={() => getData(setData, setLoading)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><RefreshIcon display="inline" marginRight={4} size={12} />Refresh</button>
        </div>),
      ]} />
      <AddDepartmentModal open={open} onClose={() => setOpen(false)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <UpdateDepartmentModal oldData={selectedDepartmentName} open={!!selectedUpdateId} onClose={() => setSelectedUpdateId("")} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
    </div>
  )
}