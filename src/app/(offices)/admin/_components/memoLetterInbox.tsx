'use client';;
import { approveMemorandumLetter, rejectMemorandumLetter } from "@/actions/admin";
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, ESignatureDocument, LetterDocument, MemoDocument, Roles, SignatureApprovals, UserDocument } from "@/lib/modelInterfaces";
import { HighestPosition, ViewLayout } from "@/lib/types";
import clsx from "clsx";
import { ConfirmIcon, CrossIcon, DocumentIcon, EditIcon, GridViewIcon, ListColumnsIcon, RefreshIcon, toaster, } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import CreateFromTemplate from "./createFromTemplate";
import ThumbnailItemWithDepartment from "./thumbnailItemWithDepartment";

export default function MemoLetterInbox({ doctype, searchParam, showRejected = false }: Readonly<{ doctype: DocumentType, searchParam: string, showRejected?: boolean }>) {
  const [data, setData] = useState<(MemoDocument & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; nextQueue: boolean, hasResponded: boolean, highestPosition: HighestPosition })[]|(LetterDocument & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; nextQueue: boolean, hasResponded: boolean, highestPosition: HighestPosition }|any)[]>([]);
  const [hideRejected, setHideRejected] = useState(!showRejected);
  const [hidePreparedByMe, setHidePreparedByMe] = useState(false);
  const [hidePending, setHidePending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument) & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; nextQueue: boolean, hasResponded: boolean, highestPosition: HighestPosition }>();
  const [search, setSearch] = useState<string>(searchParam || '');
  const [isEditingRejected, setIsEditingRejected] = useState<boolean>(false);
  const isRejectedMemo = useMemo(() => selectedMemo && selectedMemo.isRejected, [selectedMemo])
  const isPreparedByMe = useMemo(() => selectedMemo && selectedMemo.isPreparedByMe, [selectedMemo])
  const isPending = useMemo(() => selectedMemo && selectedMemo.isPending, [selectedMemo])

  const filteredData = useMemo(() => {
    let filtered = data.filter((doc) => (doc.isPreparedByMe || !!doc.hasResponded || !!doc.nextQueue));
    if (hideRejected) {
      filtered = filtered.filter((doc) => !doc.isRejected)
    }
    if (hidePreparedByMe) {
      filtered = filtered.filter((doc) => !doc.isPreparedByMe)
    }
    if (hidePending) {
      filtered = filtered.filter((doc) => (hidePreparedByMe && !doc.isPreparedByMe && !doc.isPending) || (!hidePreparedByMe && (doc.isPreparedByMe || !doc.isPending)))
    }
    if (search && search.length > 0) {
      filtered = filtered.filter((item) => (
        item._id!.toLowerCase() === search.toLowerCase()
        || item.title.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument).name.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument).name.toLowerCase() === search.toLowerCase()
        || ((new Date(item.createdAt as string)).toLocaleDateString()).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString()).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })).toLowerCase().includes(search.toLowerCase())
        || item.series?.toLowerCase() === search.toLowerCase()
        || item.preparedByName?.toLowerCase().includes(search.toLowerCase())
      ))
    }
    return filtered
  }, [data, hidePending, hidePreparedByMe, hideRejected, search])

  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo', window.location.origin)
    url.searchParams.set('doctype', doctype)
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => { console.log(result); setData(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBack = useCallback(() => {
    setIsEditingRejected(false);
    setSelectedMemo(undefined);
  }, [])

  const onApprove = useCallback(() => {
    if (!!selectedMemo) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#61a118',
        cancelButtonColor: '#474747',
        confirmButtonText: 'Yes, Approve!'
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          const save = approveMemorandumLetter.bind(null, doctype, selectedMemo._id as string)
          const { success, error } = await save()
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            setTimeout(() => getData(), 500)
            onBack();
          }
        }
      })
    }
  }, [selectedMemo, doctype, getData, onBack])

  const onReject = useCallback(() => {
    if (!!selectedMemo) {
      Swal.fire({
        title: 'Reject to sign this?',
        text: "You won't be able to revert this!",
        input: "textarea",
        inputAttributes: {
          placeholder: "Type your rejection reason here..."
        },
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#474747',
        confirmButtonText: 'Yes, Reject!',
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        preConfirm(reason) {
          if (reason.trim() === '') {
            throw new Error('Please provide a rejection reason.')
          }
          return new Promise(async (resolve, reject) => {
            try {
              const save = rejectMemorandumLetter.bind(null, doctype, selectedMemo._id as string, reason)
              const response = await save()
              resolve(response)
            } catch (e: any) {
              reject(e)
            }
          })
            .then((response) => response)
            .catch((err) => {
              Swal.showValidationMessage(err.message)
            })
        }
      }).then(async ({ isConfirmed, value }) => {
        if (isConfirmed) {
          if (value.error) {
            toaster.danger(value.error)
          } else if (value.success) {
            toaster.success(value.success)
            setTimeout(() => getData(), 500)
            onBack();
          }
        }
      })
    }
  }, [selectedMemo, doctype, getData, onBack])

  const onShowReason = useCallback(() => {
    if (!!selectedMemo) {
      const rejected: SignatureApprovals|undefined = selectedMemo.signatureApprovals?.find((v: SignatureApprovals) => !!v.rejectedReason);

      Swal.fire({
        title: 'Reason for Rejection',
        text: rejected!.rejectedReason,
        showConfirmButton: false
      })
    }
  }, [selectedMemo])


  const [signatoriesList, setSignatoriesList] = useState<ESignatureDocument[]>([])

  useEffect(() => {
    const url = new URL('/' + Roles.Admin + '/api/signatories', window.location.origin);
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => {
        setSignatoriesList(result)
      })
      .catch(console.log)
  }, [])

  const selectedSignatoriesList = useMemo(() => {
    const selectedDepartment = (selectedMemo as MemoDocument|LetterDocument)?.departmentId
    return signatoriesList.sort((a: ESignatureDocument & { adminId: UserDocument } | any, b: ESignatureDocument & { adminId: UserDocument } | any) => {
        const heri: any = {
          [HighestPosition.Admin]: 1,
          [HighestPosition.VicePresident]: 2,
          [HighestPosition.President]: 3
        }
        if (a.adminId.highestPosition === HighestPosition.President || a.adminId.highestPosition === HighestPosition.VicePresident
          || b.adminId.highestPosition === HighestPosition.President || b.adminId.highestPosition === HighestPosition.VicePresident) {
          return heri[a.adminId.highestPosition] < heri[b.adminId.highestPosition]
            ? 1
            : heri[a.adminId.highestPosition] > heri[b.adminId.highestPosition]
            ? -1
            : 0
        }
        return a.adminId.departmentIds?.includes(selectedDepartment) && b.adminId.departmentIds?.includes(selectedDepartment)
          ? 0
          : (
            a.adminId.departmentIds?.includes(selectedDepartment)
            ? -1
            : (b.adminId.departmentIds?.includes(selectedDepartment)
              ? 1
              : 0
            )
          )
      })
  }, [signatoriesList, selectedMemo]);

  const [viewLayout, setViewLayout] = useState<ViewLayout>("list");

  const approveRejectDisabled = useMemo(() => !selectedMemo?.nextQueue, [selectedMemo]);

  return (<>
    <div className="p-6">
      <h1 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? "Memorandum for approval list" : "Letter for approval list"}</h1>
      <div className="mt-3 flex flex-col lg:flex-row lg:flex-betweeen flex-wrap w-full min-w-[300px] lg:min-w-[800px] bg-white p-4 rounded-t-lg">
        <div className="flex flex-wrap">
          <label htmlFor="searchMemo" className="font-[500] mr-2 items-center flex">Search:</label>
          <input type="search" id="searchMemo" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Memorandum" className="border-2 max-w-64 border-gray-300 px-2 py-1 rounded" />
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="hideRejected" className="ml-2" onChange={(e) => setHideRejected(e.target.checked)} checked={hideRejected} />
            <label htmlFor="hideRejected" className="font-[500] text-sm">Hide Rejected</label>
          </div>
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="hidePreparedByMe" className="ml-2" onChange={(e) => setHidePreparedByMe(e.target.checked)} checked={hidePreparedByMe} />
            <label htmlFor="hidePreparedByMe" className="font-[500] text-sm">Hide Prepared By Me</label>
          </div>
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="hidePending" className="ml-2" onChange={(e) => setHidePending(e.target.checked)} checked={hidePending} />
            <label htmlFor="hidePending" className="font-[500] text-sm">Hide Pending Others</label>
          </div>
        </div>
        <div className="flex mt-2 lg:mt-0 lg:justify-end flex-grow pr-2 lg:pr-0 gap-x-2">
          <button type="button" onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")} title={viewLayout === "grid" ? "List View" : "Grid View"} className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50">
            {viewLayout === "list" ? <GridViewIcon /> : <ListColumnsIcon />}
          </button>
          <button type="button" onClick={getData} title="Refresh List" className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50"><RefreshIcon /></button>
        </div>
      </div>
      <div className="min-h-[200px] min-w-[300px] bg-white w-full p-4 lg:min-w-[800px]">
        <div className="border min-w-[300px] rounded-md p-2 lg:min-w-[780px]">
          <div className={clsx(viewLayout === "grid" ? "grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] p-3 gap-3" : "w-full grid grid-cols-1 gap-2")}>
            { loading && <LoadingComponent /> }
            { !loading && filteredData.length === 0 && <div className="text-center">No {doctype === DocumentType.Memo ? "memorandum" : "letter"} for approval.</div>}
            { !loading && filteredData.map((memoLetter, i) => (
              <ThumbnailItemWithDepartment layout={viewLayout} withSignatureNames={memoLetter.signatureNames} key={memoLetter._id} onClick={() => setSelectedMemo(memoLetter)} isRejected={memoLetter.isRejected} preparedByMe={memoLetter.isPreparedByMe} isPreparedBy={memoLetter.preparedByName} isPending={memoLetter.isPending} thumbnailSrc="/thumbnail-document.png" department={(memoLetter.departmentId as DepartmentDocument).name} label={memoLetter.title} series={memoLetter.series} createdAt={memoLetter.createdAt} updatedAt={memoLetter.updatedAt} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack} allowOutsideClick={!isEditingRejected}>
      {isEditingRejected ? (
        <div className="max-h-[calc(100vh-100px)] overflow-y-auto">
          <CreateFromTemplate
            key={selectedMemo?._id}
            editingId={selectedMemo?._id}
            rejectedId={selectedMemo?._id}
            // isHighestPosition={selectedMemo?.highestPosition === HighestPosition.President}
            departmentId={selectedMemo?.departmentId as any}
            template={selectedMemo as any}
            doctype={doctype}
            signatoriesList={selectedSignatoriesList}
            onSave={(memoId) => {
              Swal.fire({
                icon: 'success',
                title: (doctype === DocumentType.Memo ? "Memorandum" : "Letter") + ' modified and sent for approval',
                text: (doctype === DocumentType.Memo ? "Memorandum" : "Letter")  + ' saved successfully',
                showConfirmButton: false,
                timer: 1500
              })
              onBack();
              setTimeout(() => getData())
            }}
            onCancel={() => setIsEditingRejected(false)}
          />
        </div>
      ) : (<>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate role={Roles.Admin} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-between items-center gap-x-3 pr-2">
        <div>
          {isRejectedMemo && isPreparedByMe && <button className="bg-yellow-100 rounded px-2 py-1 hover:bg-yellow-200" onClick={() => setIsEditingRejected(true)}><EditIcon className="inline" /> Edit this {doctype === DocumentType.Memo ? "memorandum" : "letter"}.</button>}
        </div>
        <div className="flex justify-end items-center gap-x-3">
          {isRejectedMemo && <div className="text-red-500"><CrossIcon display="inline" />This {doctype === DocumentType.Memo ? "memorandum" : "letter"} has been rejected. <button className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 rounded" onClick={onShowReason}><DocumentIcon display="inline" /> Reason</button></div>}
          {isPending && !isRejectedMemo && <div className="text-gray-500">This {doctype === DocumentType.Memo ? "memorandum" : "letter"} is pending for others</div>}
          {isPreparedByMe && <div className="text-blue-500">This {doctype === DocumentType.Memo ? "memorandum" : "letter"} is prepared by you</div>}
          {!(isRejectedMemo || isPreparedByMe || isPending) && (<>
            <button type="button" className="rounded-lg bg-green-600 hover:bg-green-500 text-white px-3 py-1 disabled:bg-gray-300" onClick={onApprove} disabled={approveRejectDisabled}><ConfirmIcon display="inline" /> Approve</button>
            <button type="button" className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1 disabled:bg-gray-300" onClick={onReject} disabled={approveRejectDisabled}><CrossIcon display="inline" />Reject</button>
          </>)}
          <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={onBack}>Close</button>
        </div>
      </div>
      </>)}
    </OCSModal>
  </>)
}