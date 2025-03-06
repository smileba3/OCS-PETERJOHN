'use client';;
import { saveESignature, updateESignature } from '@/actions/admin';
import LoadingComponent from '@/components/loading';
import OCSModal from '@/components/ocsModal';
import { ESignatureDocument, PhotoFileDocument, Roles, UserDocument } from '@/lib/modelInterfaces';
import clsx from 'clsx';
import { EditIcon, Image, PlusIcon } from 'evergreen-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from 'sweetalert2';
import SignaturePad from "./signaturePad";

function getPhotoURL(id?: string, photoBuffer?: Buffer, type?: string): string | undefined
{
  // convert buffer to object url
  if (!photoBuffer || !id || !type) return undefined;
  const objectURL = URL.createObjectURL(new Blob([photoBuffer], { type }));
  return objectURL;
}

function EmployeeSelection({
  photo,
  employeeId,
  employeeFullName,
  className,
  ...props
}: Readonly<{
  photo?: PhotoFileDocument
  employeeId: string
  employeeFullName: string
  className?: string
} & any>) {

  const [photoURL, setPhotoURL] = useState<string | undefined>()

  useEffect(() => {
    if (photo?.file) {
      const p = getPhotoURL(photo._id, Buffer.from(photo.file as any), photo.mimeType)
      setPhotoURL(p)
      return () => {
        if (p && p.startsWith('blob:')) {
          URL.revokeObjectURL(p)
        }
      }
    }
  }, [photo])

  return (
    <button type="button" className={clsx("border p-4 max-w-64 hover:bg-gray-400/20 rounded", className)} {...props}>
      <div className="aspect-square max-w-32 mb-1 mx-auto bg-white">
        <Image src={photoURL || "/photo-profile-default.jpg"} alt="Photo" />
      </div>
      <div className="text-center text-xs">Employee ID: {employeeId}</div>
      <div className="text-center text-xs">{employeeFullName}</div>
    </button>
  )
}


async function getData(setData: (data: (UserDocument & { eSignature: ESignatureDocument })|undefined) => void, setLoading: (loading: boolean) => void) {
  setLoading(true)
  try {
    const response = await fetch('/' + Roles.Admin + '/api/signature')
    const { result } = await response.json();
    setData(result)
    setLoading(false)
  } catch (e) {
    console.log(e)
    setLoading(false)
  }
}

export default function AdminSignature() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<(UserDocument & { eSignature: ESignatureDocument })|undefined>()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showModalEdit, setShowModalEdit] = useState<boolean>(false)

  const getFullName = useCallback((admin?: UserDocument) => {
    return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
  }, [])

  const eSignature = useMemo<{ employeeId: string, fullName: string, url?: string } | undefined>(() => !!data ? {
    employeeId: data.employeeId,
    fullName: getFullName(data),
    url: data.eSignature?.signature,
  } : undefined
  , [data, getFullName]);

  const saveSignature = useMemo(() => saveESignature.bind(null, data?._id), [data])

  const signaturePadRef = useRef<any>(null)
  const signaturePadRefCreate = useRef<any>(null)

  const handleClear = useCallback(() => {
    signaturePadRef.current?.clear()
  }, [signaturePadRef])

  const onClose = useCallback(() => {
    setShowModal(false)
    setShowModalEdit(false)
    handleClear()
  }, [handleClear])

  const handleSave = useCallback(() => {
    const signatureData = signaturePadRefCreate.current?.toDataURL()
    Swal.fire({
      icon: 'question',
      title: 'Confirm Signature?',
      text: getFullName(data),
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
    }).then(async ({ isConfirmed }) => {
      if (isConfirmed) {
        const { success, error } = await saveSignature(signatureData)
        if (error) {
          Swal.fire({ icon: 'error', title: 'Error', text: error })
        } else if (success) {
          Swal.fire({ icon:'success', title: 'Success', text: 'Signature saved successfully' })
          setShowModal(false)
          handleClear()
          getData(setData, setLoading)
        }
      }
    })
  }, [signaturePadRefCreate, data, handleClear, getFullName, saveSignature])

  const handleUpdate = useCallback(() => {
    const signatureData = signaturePadRef.current?.toDataURL()
    Swal.fire({
      icon: 'question',
      title: 'Confirm Signature?',
      text: getFullName(data),
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
    }).then(async ({ isConfirmed }) => {
      if (isConfirmed) {
        const { success, error } = await updateESignature(signatureData)
        if (error) {
          Swal.fire({ icon: 'error', title: 'Error', text: error })
        } else if (success) {
          Swal.fire({ icon:'success', title: 'Success', text: 'Signature saved successfully' })
          onClose()
          getData(setData, setLoading)
        }
      }
    })
  }, [signaturePadRef, data, onClose, getFullName])

  useEffect(() => {
    getData(setData, setLoading)
  }, []);

  // const onRemoveSignature = useCallback(() => {
  //   if (!!eSignature) {
  //     Swal.fire({
  //       title: 'Remove Signature?',
  //       text: "Employee ID " + eSignature?.employeeId,
  //       icon: 'question',
  //       showCancelButton: true,
  //       confirmButtonColor: '#d33',
  //       cancelButtonColor: '#888',
  //       confirmButtonText: 'Yes, remove it!'
  //     })
  //       .then(({ isConfirmed }) => {
  //         if (isConfirmed) {
  //           const removeSignature = removeAdminSignature.bind(null, eSignature?.employeeId);
  //           removeSignature()
  //             .then(({ success, error } ) => {
  //               if (error) {
  //                 toaster.danger(error);
  //               } else {
  //                 toaster.success(success)
  //                 setTimeout(() => getData(setData, setLoading), 500)
  //               }
  //             })
  //             .catch(console.log)
  //         }
  //       })
  //   }
  // }, [eSignature])

  return (<>
    <div className="m-6 p-4 border">
      {loading && (
        <div className="flex items-center justify-center h-full w-full">
          <LoadingComponent />
        </div>
      )}
      {!loading && (<>
        {!eSignature?.url ? (
          <button type="button" disabled={!data} onClick={() => setShowModal(true)} className="border p-2 rounded bg-blue-700 hover:bg-blue-500 text-white font-[600] disabled:cursor-not-allowed disabled:bg-gray-300">
            <PlusIcon display="inline" /> Register Your E-Signature
          </button>
        ) : (<>
          <div className="text-2xl font-bold mb-2">My E-Signature:</div>
          <div className="bg-white border p-4">
            <Image src={eSignature?.url} alt="E-Signature" className="mx-auto"/>
          </div>
          <div className="flex justify-end items-end p-3">
            <button type="button" disabled={!data} onClick={() => setShowModalEdit(true)} className="bg-blue-700 hover:bg-blue-500 text-white rounded py-2 px-3  disabled:cursor-not-allowed disabled:bg-gray-300"><EditIcon className="inline" /> Edit Signature</button>
          </div>
        </>)}
      </>)}
    </div>
    <OCSModal title="E-Signature Registration" open={showModal} onClose={() => onClose()}>
      <div className="px-4 py-1">
        <h3 className="text-lg mb-1">{getFullName(data)} (Employee ID: {data?.employeeId})</h3>
        <h3 className="text-lg mb-1">Please sign here:</h3>
        <div className="bg-white border border-black max-w-fit mx-auto hover:cursor-crosshair" tabIndex={0}>
          <SignaturePad refer={signaturePadRefCreate} />
        </div>
      </div>
      <div className="flex gap-x-2 items-center justify-center mt-4 mb-2">
        <button type="button" onClick={onClose} className="border p-2 rounded bg-red-500 text-white font-[600]">
          Cancel
        </button>
        <button type="button" onClick={handleClear} className="border py-2 px-3 rounded bg-gray-500 text-white font-[600]">
          Clear
        </button>
        <button type="button" onClick={handleSave} className="border py-2 px-3 rounded bg-green-700 text-white font-[600]">
          Save
        </button>
      </div>
    </OCSModal>
    <OCSModal title="Change your E-Signature" open={showModalEdit} onClose={() => onClose()}>
      <div className="px-4 py-1">
        <h3 className="text-lg mb-1">{getFullName(data)} (Employee ID: {data?.employeeId})</h3>
        <h3 className="text-lg mb-1">Please sign here:</h3>
        <div className="bg-white border border-black max-w-fit mx-auto hover:cursor-crosshair" tabIndex={0}>
          <SignaturePad refer={signaturePadRef} />
        </div>
      </div>
      <div className="flex gap-x-2 items-center justify-center mt-4 mb-2">
        <button type="button" onClick={onClose} className="border p-2 rounded bg-red-500 text-white font-[600]">
          Cancel
        </button>
        <button type="button" onClick={handleClear} className="border py-2 px-3 rounded bg-gray-500 text-white font-[600]">
          Clear
        </button>
        <button type="button" onClick={handleUpdate} className="border py-2 px-3 rounded bg-green-700 text-white font-[600]">
          Save
        </button>
      </div>
    </OCSModal>
  </>)
}