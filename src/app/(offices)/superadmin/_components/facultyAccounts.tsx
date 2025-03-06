'use client';;
import { removeAccountDepartment, toogleActiveAccount } from "@/actions/superadmin";
import OCSTable from "@/components/table";
import { DepartmentDocument, Roles } from "@/lib/modelInterfaces";
import type { TableColumnProps } from "@/lib/types";
import clsx from "clsx";
import { AddIcon, Avatar, CrossIcon, EditIcon, PlusIcon, RefreshIcon, RemoveIcon, toaster, UpdatedIcon, WarningSignIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AddFacultyAccountModal from "./addFacultyAccountModal";
import AddFacultyDepartmentModal from "./addFacultyDepartmentModal";
import type { AccountsColumns } from './types';
import UpdateAccountModal from "./updateAccountModal";

const objectURLS = new Map<string, string>();

function getPhotoURL(id?: string, photoBuffer?: Buffer, type?: string): string | undefined
{
  // convert buffer to object url
  if (!photoBuffer || !id || !type) return undefined;
  if (objectURLS.has(id)) return objectURLS.get(id);
  const objectURL = URL.createObjectURL(new Blob([photoBuffer], { type }));
  objectURLS.set(id, objectURL);
  return objectURL;
}

function getFacultyAccountsColumns({ onRemoveDepartment, onAddDepartment, onUpdate, onToggleActive }: Readonly<{ onUpdate: (id: string) => void, onToggleActive: (id: string, activate: boolean) => void, onAddDepartment: (id: string) => void, onRemoveDepartment: (id: string, departmentId: string) => void }>): TableColumnProps[]
{
  return [
    {
      label: 'Photo', field: "photo", align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex items-center justify-center gap-4">
          <Avatar src={!!row.photo ? getPhotoURL(row.photo?._id, Buffer.from(row.photo?.file as any), row.photo?.mimeType) : ''} name={row.firstName + " " + row.lastName} size={48} />
        </div>
      ),
    },
    {
      label: "Employee ID", field: "employeeId", sortable: true, searchable: true, align: 'center'
    },
    {
      label: "Prefix Name", field: "prefixName", sortable: true, searchable: true,
    },
    {
      label: "First Name", field: "firstName", sortable: true, searchable: true,
    },
    {
      label: "Middle Name", field: "middleName", sortable: true, searchable: true,
    },
    {
      label: "Last Name", field: "lastName", sortable: true, searchable: true,
    },
    {
      label: "Suffix Name", field: "suffixName", sortable: true, searchable: true,
    },
    {
      label: 'Email Address', field: "email", sortable: true, searchable: true,
    },
    {
      label: "Departments", field: "departments", align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex flex-col justify-start items-start min-w-32 gap-y-1">
          { row.departmentIds.map((department: DepartmentDocument, index: number) => (
            <div key={"dep" + index} className={
              clsx(
                "captitalize flex-grow p-2 rounded-full mx-auto flex w-full justify-center text-wrap gap-x-1",
                index % 2 === 0 ? "bg-sky-300 text-black" : "bg-green-300 text-black",
              )}
            >
              <span className="flex-grow px-2">{department.name}</span>
              <button type="button" onClick={() => onRemoveDepartment(row._id, department._id as string)}  title="Remove Assigned Department" className="text-red-500 ml-1 flex-shrink pr-1">
                <CrossIcon size={12} />
              </button>
            </div>
          ))}
          {
            row.departmentIds.length === 0 && (
              <div className="mx-auto text-yellow-500 drop-shadow"><WarningSignIcon size={25} /></div>
            )
          }
          </div>
      ),
    },
    {
      label: "Status", field: "deactivated", sortable: true, searchable: true,
      render: (row: AccountsColumns) => (
        <div className={
          clsx(
            "captitalize p-2 rounded-full max-w-32 mx-auto text-center",
            !row.deactivated && "bg-green-500 text-green-900 font-[700]",
            !!row.deactivated && "bg-gray-400 text-white",
          )}
        >
          {row.deactivated? "Deactivated" : "Active"}
        </div>
      ),
    },
    {
      label: "Action", field: "actions", align: "center",
      render: (row: AccountsColumns) => (
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => onAddDepartment(row._id)} title="Assign to Department">
            <AddIcon />
          </button>
          <button type="button" onClick={() => onUpdate(row._id)} title="Edit">
            <EditIcon />
          </button>
          <button type="button" onClick={() => onToggleActive(row._id, row.deactivated)} title="Active/Deactivate Account" className={clsx(row.deactivated ? "text-green-500" : "text-red-500")}>
            {row.deactivated ? <UpdatedIcon /> : <RemoveIcon />}
          </button>
        </div>
      )
    },
  ]
}

async function getData(setData: (data: AccountsColumns[]) => void, setLoading: (loading: boolean) => void) {
  setLoading(true)
  try {
    const response = await fetch('/' + Roles.SuperAdmin + '/api/faculties')
    const { result } = await response.json();
    setData(result)
    setLoading(false)
  } catch (e) {
    console.log(e)
    setLoading(false)
  }
}

export default function FacultyAccountsPage() {
  const [data, setData] = useState<AccountsColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<AccountsColumns|undefined>();

  const selectedDepartmentNames = useMemo(() => {
    if (!data) return [];
    const dt = data.find((d) => d?._id === selectedId)
    if (!dt) return [];
    return dt.departmentIds?.map((dept) => dept?.name || "") || []
  }, [selectedId, data]);

  const onUpdate = useCallback((id: string) => {
    setSelectedUpdate(data.find((d) => d._id === id));
  }, [data]);

  const onToggleActive = useCallback((id: string, activate: boolean) => {
    Swal.fire({
      title: (activate ? 'Activate' : 'Deactivate') + ' Account?',
      text: data.find((d) => d._id === id)?.employeeId,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: activate ? '#168d26' : '#d33',
      cancelButtonColor: '#888',
      confirmButtonText: 'Yes, ' + (activate ? 'Activate' : 'Deactivate') + ' it!'
    })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          const removeDept = toogleActiveAccount.bind(null, id);
          removeDept()
            .then(({ success, error } ) => {
              if (error) {
                toaster.danger(error);
              } else {
                toaster.success(success)
                setTimeout(() => getData(setData, setLoading), 500)
              }
            })
            .catch(console.log)
        }
      })
  }, [data]);

  const onAddDepartment = useCallback((id: string) => {
    setSelectedId(id);
    setDeptOpen(true);
  }, []);

  const onRemoveDepartment = useCallback((id: string, departmentId: string) => {
    Swal.fire({
      title: 'Remove Department from Employee ID ' + data.find((d) => d._id == id)?.employeeId + '?',
      text: "Employee ID " + data.find((d) => d._id === id)?.departmentIds?.find((d) => d._id == departmentId)?.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          const removeDept = removeAccountDepartment.bind(null, { id, departmentId });
          removeDept()
            .then(({ success, error } ) => {
              if (error) {
                toaster.danger(error);
              } else {
                toaster.success(success)
                setTimeout(() => getData(setData, setLoading), 500)
              }
            })
            .catch(console.log)
        }
      })
  }, [data]);

  const facultyColumns = getFacultyAccountsColumns({
    onUpdate,
    onToggleActive,
    onAddDepartment,
    onRemoveDepartment,
  });

  useEffect(() => {
    getData(setData, setLoading);
  }, []);

  useEffect(() => {
    return () => {
      if (objectURLS.size > 0) {
        objectURLS.forEach((url) => URL.revokeObjectURL(url));
        objectURLS.clear();
      }
    }
  }, [])

  return (
    <div className="px-8 py-4">
      <h1 className="text-[25px] font-[600] mb-4">Faculty Account Management</h1>
      <OCSTable loading={loading} columns={facultyColumns} data={data} searchable toolbars={[
        (<div key={"deptoolbar1"} className="flex flex-nowrap gap-x-2 justify-end items-center">
          <button key={"addfaculty1"} type="button" onClick={() => setOpen(true)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><PlusIcon display="inline" marginRight={4} size={12} />Add Department</button>
          <button type="button" onClick={() => getData(setData, setLoading)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><RefreshIcon display="inline" marginRight={4} size={12} />Refresh</button>
        </div>)
      ]} />
      <AddFacultyAccountModal open={open} onClose={() => setOpen(false)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <AddFacultyDepartmentModal id={selectedId} departments={selectedDepartmentNames} open={deptOpen} onClose={() => setDeptOpen(false)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <UpdateAccountModal oldData={selectedUpdate} open={!!selectedUpdate} onClose={() => setSelectedUpdate(undefined)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} isFaculty />
    </div>
  )
}