'use client';
import { updateProfileAccount, uploadProfilePhoto } from '@/actions/account';
import { ActionResponseType } from "@/actions/superadmin";
import LoadingComponent from "@/components/loading";
import { PhotoFileDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import { useSession } from "@/lib/useSession";
import clsx from 'clsx';
import { ConfirmIcon, EditIcon, Image, toaster, UploadIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormState } from "react-dom";

function photoBufferToPhoto(buffer: Buffer, type: string) {
  if (buffer.length > 0) {
    const blob = new Blob([buffer], { type })
    const objectURL = URL.createObjectURL(blob)
    return objectURL
  }
  return ''
}

async function getData(role: Roles, setData: (data: UserDocument) => void) {
  const url = new URL('/' + role + '/api/account', window.location.origin)
  try {
    const response = await fetch(url)
    const { result } = await response.json()
    setData(result)
  } catch (e) {
    console.error(e)
  }
}

function EditInputComponent({ label, id, name, className, ...props }: { label: string, id: string, name?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex">
      <label className="min-w-32 max-w-32 text-wrap mb-2 text-sm font-medium text-gray-900" htmlFor={id}>{label}</label>
      <input type="text" className={clsx("flex-grow px-2 text-sm text-gray-900 border border-gray-300 rounded-lg", className)} id={id} name={name} {...props} />
    </div>
  )
}

export default function MyAccountSettings({
  role
}: {
  role: Roles
}) {
  const { data: sessionData, status, refresh, update } = useSession({
    redirect: true
  })
  const [data, setData] = useState<UserDocument>()
  const [photoImage, setPhotoImage] = useState<string>("")

  const photoActionForm = useMemo(() => uploadProfilePhoto.bind(null, role, status === "authenticated" ? sessionData!.user._id || '' : ''), [sessionData, status, role])
  const [photoState, photoAction, photoPending] = useFormState<ActionResponseType, FormData>(photoActionForm, {})

  const [photoUpload, setPhotoUpload] = useState<string>("/photo-profile-default.jpg")
  const photoRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!photoPending && photoState.success) {
      toaster.success(photoState.success, { duration: 3 })
      photoRef.current?.reset()
      setTimeout(() => getData(role, setData), 500)
      setTimeout(() => refresh(), 500)
      setTimeout(() => update(), 500)
    } else if (!photoPending && photoState.error) {
      toaster.danger(photoState.error, { duration: 3 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoState, photoPending])

  useEffect(() => {
    getData(role, setData)
  }, [role])

  useEffect(() => {
    if (!!(data?.photo as PhotoFileDocument)?.file) {
      const file = data?.photo as PhotoFileDocument
      const photo = photoBufferToPhoto(Buffer.from(file.file as any), file.mimeType)
      setPhotoImage(photo)
      return () => {
        if (photo && photo.startsWith('blob:')) {
          URL.revokeObjectURL(photo)
        }
      }
    } else {
      setPhotoImage("/photo-profile-default.jpg")
    }
  }, [data])

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editingFields, setEditingFields] = useState<{
    prefixName: string
    suffixName: string
    firstName: string
    middleName: string
    lastName: string
    email: string
    password: string
  }>({
    prefixName: '',
    suffixName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    if (data && isEditing) {
      setEditingFields({
        prefixName: data.prefixName || '',
        suffixName: data.suffixName || '',
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        email: data.email,
        password: '',
      })
    } else {
      setEditingFields({
        prefixName: '',
        suffixName: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
      })
    }
  }, [data, isEditing])

  const updateFormAction = useMemo(() => updateProfileAccount.bind(null, role, status === "authenticated" ? sessionData!.user._id || '' : ''), [sessionData, status, role])
  const updateFormRef = useRef<HTMLFormElement>(null)

  const onSubmitUpdate = useCallback(async (e: any) => {
    e.preventDefault()
    if (Object.entries(editingFields).some(([key, value]) => (key !== 'password' && (data as any)?.[key] !== value) || (key === 'password' && !!value && (value as string).length > 0))) {
      const formData = new FormData()
      Object.entries(editingFields).forEach(([key, value]) => {
        formData.set(key, value)
      })
      const { error, success } = await updateFormAction(formData)
      if (error) {
        toaster.danger(error, { duration: 3 })
      } else if (success) {
        updateFormRef.current?.reset()
        setTimeout(() => getData(role, setData), 500)
        setIsEditing(false)
        toaster.success(success, { duration: 3 })
      }
    }
  }, [data, editingFields, updateFormAction, role])

  if (status === "loading") return <LoadingComponent />

  return (
    <div className="w-full pt-6 px-8">
      <h1 className="font-[600] text-2xl">Account Settings</h1>
      <div className="mt-4 border border-blue-700 rounded-lg min-h-[100px] min-w-[430px]">
        <div className="px-4 pt-2 pb-1 border-b border-blue-700/50">
          <h3 className="text-xl font-[500]">Profile</h3>
        </div>
        <div className="p-4 flex flex-col lg:flex-row justify-start gap-y-2 lg:gap-y-0 lg:gap-x-4">
          <div className="flex justify-start items-start">
            <div className="border rounded max-w-32 min-w-32 flex items-center justify-center aspect-square shadow object-contain">
              <Image src={photoImage} alt="Profile Picture" />
            </div>
            <div className="ml-2 min-w-64">
              <form action={photoAction} ref={photoRef}>
                <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="photo">Update Photo:</label>
                <input onChange={(e) => setPhotoUpload(e.target.value)} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" id="photo" name="photo" type="file" accept="image/*" />
                {!!photoUpload && <button type="submit" className="mt-2 block px-3 py-1 text-sm font-medium rounded border border-gray-900 hover:bg-gray-200" title="Upload"><UploadIcon display="inline" marginRight={2} />Upload</button>}
              </form>
            </div>
          </div>

          <div className="px-4 w-full relative">
            { !isEditing && (<>
              <button type="button" title="Edit" onClick={() => setIsEditing(true)} className="absolute right-0 top-0 p-1 border border-slate-400 hover:bg-gray-200 rounded-lg"><EditIcon display="inline" /> Edit</button>
              <h3 className="text-xl font-[500]">{data?.prefixName} {data?.firstName} {data?.middleName} {data?.lastName}{!!data?.suffixName ? ", " + data.suffixName : ""}</h3>
              <p className="text-sm text-gray-600">{data?.email}</p>
            </>)}
            <form className={clsx("flex flex-col gap-y-2 mt-8", !isEditing ? 'hidden' : '')} ref={updateFormRef} onSubmit={onSubmitUpdate}>
              <button type="submit" title="Save" onClick={() => setIsEditing(false)} className="absolute right-0 top-0 p-1 border border-green-400 hover:bg-green-200 rounded-lg"><ConfirmIcon display="inline" /> Save</button>
              <EditInputComponent label="Prefix Name:" id="prefixName" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, prefixName: e.target.value })} value={editingFields.prefixName} className="max-w-32" />
              <EditInputComponent label="First Name:" id="firstName" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, firstName: e.target.value })} value={editingFields.firstName}  className="max-w-64" />
              <EditInputComponent label="Middle Name:" id="middleName" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, middleName: e.target.value })} value={editingFields.middleName} className="max-w-64" />
              <EditInputComponent label="Last Name:" id="lastName" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, lastName: e.target.value })} value={editingFields.lastName} className="max-w-64" />
              <EditInputComponent label="Suffix Name:" id="suffixName" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, suffixName: e.target.value })} value={editingFields.suffixName} className="max-w-32" />
              <EditInputComponent label="Email Address:" id="email" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, email: e.target.value })} value={editingFields.email} className="max-w-64" />
              <EditInputComponent label="Password:" id="password" disabled={!isEditing} onChange={(e) => setEditingFields({ ...editingFields, password: e.target.value })} value={editingFields.password} placeholder="Leave blank if not change" className="max-w-64 placeholder:italic" />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}