'use client';;
import { removeAccountDepartment, toogleActiveAccount } from "@/actions/superadmin";
import OCSModal from "@/components/ocsModal";
import OCSTable from "@/components/table";
import { DepartmentDocument, Roles } from "@/lib/modelInterfaces";
import { HighestPosition, type TableColumnProps } from "@/lib/types";
import clsx from "clsx";
import {
  AddIcon,
  Avatar,
  ConfirmIcon,
  CrossIcon,
  EditIcon,
  Image,
  PlusIcon,
  RefreshIcon,
  RemoveIcon,
  SmallCrossIcon,
  toaster,
  UpdatedIcon,
  WarningSignIcon,
} from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AddAdminAccountModal from "./addAdminAccountModal";
import AddAdminDepartmentModal from "./addAdminDepartmentModal";
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

function getAdminAccountsColumns({ onRemoveDepartment, onAddDepartment, onUpdate, onToggleActive, onViewSignature }: Readonly<{ onUpdate: (id: string) => void, onToggleActive: (id: string, activate: boolean) => void, onAddDepartment: (id: string) => void, onRemoveDepartment: (id: string, departmentId: string) => void, onViewSignature: (user: AccountsColumns) => void }>): TableColumnProps[]
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
      label: "Position", field: "highestPosition", sortable: true, searchable: true,
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
      label: 'Has Registered E-Signature', field: "hasRegisteredESignature", sortable: true, searchMap: { true: 'yes', false: 'no' }, align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex justify-center items-center">
          {row.hasRegisteredSignature ? <button type="button" onClick={() => onViewSignature(row)} className="text-green-700 flex flex-nowrap gap-x-1"><ConfirmIcon size={15} color="green" /> YES</button> : <span className="text-red-500 flex flex-nowrap"><SmallCrossIcon color="red" /> NO</span>}
        </div>
      )
    },
    {
      label: "Departments", field: "departments", align: 'center',
      render: (row: AccountsColumns) => (
        <div className="flex flex-col justify-start items-start min-w-32 gap-y-1">
          { row.highestPosition === HighestPosition.Admin && row.departmentIds.map((department: DepartmentDocument, index: number) => (
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
          { row.highestPosition === HighestPosition.Admin &&
            row.departmentIds.length === 0 && (
              <button type="button" title="No Assigned Departments" className="mx-auto text-yellow-500 drop-shadow"><WarningSignIcon size={25} /></button>
            )
          }
          { row.highestPosition !== HighestPosition.Admin && (
            <div key={"dep_" + row.highestPosition} className={
              clsx(
                "captitalize flex-grow p-2 rounded-full mx-auto flex w-full justify-center text-wrap gap-x-1",
                "bg-green-300 text-black",
              )}
            >
              <span className="flex-grow px-2">{row.highestPosition}</span>
            </div>
            )
          }
          </div>
      ),
    },
    {
      label: "Status", field: "deactivated", sortable: true, searchable: true, searchMap: { true: "Deactivated", false: "Active" },
      render: (row: AccountsColumns) => (
        <div className={
          clsx(
            "captitalize p-2 rounded-full max-w-32 mx-auto text-center",
            !row.deactivated && "bg-green-500 text-green-900 font-[700]",
            !!row.deactivated && "bg-gray-400 text-white",
          )}
        >
          {row.deactivated ? "Deactivated" : "Active"}
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
    const response = await fetch('/' + Roles.SuperAdmin + '/api/admins')
    const { result } = await response.json();
    setData(result)
    setLoading(false)
  } catch (e) {
    console.log(e)
    setLoading(false)
  }
}

export default function AdminAccountsPage() {
  const [data, setData] = useState<AccountsColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<AccountsColumns|undefined>();

  const getFullName = useCallback((admin?: AccountsColumns) => {
    return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
  }, [])

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
      text: "Employee ID " + data.find((d) => d._id === id)?.employeeId,
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
      text: data.find((d) => d._id === id)?.departmentIds?.find((d) => d._id == departmentId)?.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#888',
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

  const [openViewSignature, setOpenViewSignature] = useState<{ employeeId: string, fullName: string, url?: string } | undefined>();

  const onViewSignature = useCallback((user: AccountsColumns) => {
    const url = new URL('/' + Roles.SuperAdmin + '/api/admins/esignature', window.location.origin);
    url.searchParams.set('id', user._id);
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => !!result ? ({ employeeId: user.employeeId, fullName: getFullName(user), url: result.signature }) : undefined)
      .then(d => setOpenViewSignature(d))
      .catch(console.log)
  }, [getFullName])

  const adminColumns = getAdminAccountsColumns({
    onUpdate,
    onToggleActive,
    onAddDepartment,
    onRemoveDepartment,
    onViewSignature,
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

  useEffect(() => {
    if (!!openViewSignature) {
      document.addEventListener('contextmenu', event => event.preventDefault());
    } else {
      document.removeEventListener('contextmenu', event => event.preventDefault());
    }
  }, [openViewSignature])

  return (
    <div className="px-8 py-4">
      <h1 className="text-[25px] font-[600] mb-4">Admin Account Management</h1>
      <OCSTable loading={loading} columns={adminColumns} data={data} searchable toolbars={[
        (<div key={"adminstoolbar1"} className="flex flex-nowrap gap-x-2 justify-end items-center">
          <button type="button" onClick={() => setOpen(true)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><PlusIcon display="inline" marginRight={4} size={12} />Add Admin Account</button>
          <button type="button" onClick={() => getData(setData, setLoading)} className="bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" ><RefreshIcon display="inline" marginRight={4} size={12} />Refresh</button>
        </div>),
      ]} />
      <AddAdminAccountModal open={open} onClose={() => setOpen(false)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <AddAdminDepartmentModal id={selectedId} departments={selectedDepartmentNames} open={deptOpen} onClose={() => setDeptOpen(false)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <UpdateAccountModal oldData={selectedUpdate} open={!!selectedUpdate} onClose={() => setSelectedUpdate(undefined)} onRefresh={() => setTimeout(() => getData(setData, setLoading), 500)} />
      <OCSModal title={"E-Signature of " + openViewSignature?.fullName + " (ID: " + openViewSignature?.employeeId + ")"} open={!!openViewSignature} onClose={() => { URL.revokeObjectURL(openViewSignature?.url || ''); setOpenViewSignature(undefined); }}>
        <div className="bg-white border">
          <Image src={openViewSignature?.url} alt="E-Signature"/>
        </div>
      </OCSModal>
    </div>
  )
}