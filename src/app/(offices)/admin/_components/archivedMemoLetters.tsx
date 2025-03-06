'use client';;
import { unarchiveMemorandumLetter } from "@/actions/admin";
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import {
  DocumentType,
  LetterDocument,
  LetterIndividualDocument,
  MemoDocument,
  MemoIndividualDocument,
  Roles,
  UserDocument,
} from "@/lib/modelInterfaces";
import { ViewLayout } from "@/lib/types";
import clsx from "clsx";
import { GridViewIcon, ListColumnsIcon, ListIcon, PrintIcon, RefreshIcon, ResetIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
import Swal from "sweetalert2";
import ThumbnailItemWithDepartment from "./thumbnailItemWithDepartment";

export default function ArchivedMemoLetter({ doctype, searchParam }: Readonly<{ doctype: DocumentType, searchParam: string }>) {
  const [data, setData] = useState<(MemoDocument & { isPreparedByMe: boolean })[]|(LetterDocument & { isPreparedByMe: boolean })[]>([]);
  const [dataIndividual, setDataIndividual] = useState<(MemoIndividualDocument & { isPreparedByMe: boolean })[]|(LetterIndividualDocument & { isPreparedByMe: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument|any) & { isPreparedByMe: boolean }>();
  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo/archive', window.location.origin)
    url.searchParams.set('doctype', doctype)
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => { setData(result?.departments); setDataIndividual(result?.individuals); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBack = useCallback(() => {
    setSelectedMemo(undefined);
  }, [])

  const [search, setSearch] = useState<string>(searchParam || '')

  const filteredData = useMemo(() => {
    let filtered: any = [...data.toReversed(), ...dataIndividual.toReversed()];
    if (search) {
      filtered = filtered.filter((item: any) => (
        item._id!.toLowerCase() === search.toLowerCase()
        || item.title.toLowerCase().includes(search.toLowerCase())
        || (item as any).departmentId?.name.toLowerCase().includes(search.toLowerCase())
        || (item as any)?.departmentId?.name.toLowerCase() === search.toLowerCase()
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
    const result = filtered.toSorted((a: any, b: any) => (new Date(b.updatedAt!)).getTime() - (new Date(a.updatedAt!)).getTime());
    return [...result];
  }, [data, dataIndividual, search])

  const onPrint = useCallback(() => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    url.searchParams.set('role', Roles.Admin)
    url.searchParams.set('title', selectedMemo?.title!)
    if (selectedMemo?.userId) {
      url.searchParams.set('isForIndividual', 'true');
    }
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype, selectedMemo])

  const onPrintAttendance = useCallback((selectedId: string) => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('id', selectedId)
    url.searchParams.set('role', Roles.Admin)
    url.searchParams.set('title', "Memo/Letter Attendance")
    url.searchParams.set('type', "attendance")
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype])

  const onFacultyReaders = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo/read', window.location.origin)
    url.searchParams.set('doctype', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    fetch(url)
      .then(response => response.json())
      .then(({ data }) => {
        Swal.fire({
          title: 'Faculty Readers',
          customClass: {
            popup: 'w-[1000px]' // Apply the custom class to the popup
          },
          html: renderToString(
            <div className="bg-white p-6 rounded-lg shadow-lg mx-auto w-full">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Faculty Members Who Read This Memorandum</h2>
              {data.length === 0 ? (
                <p className="text-center text-gray-500">No faculty members have read this memorandum yet.</p>
              ) : (
                <div className="overflow-auto max-h-[400px] min-h-[400px]">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 bg-gray-100">Name</th>
                        <th className="px-4 py-2 text-left text-gray-600 bg-gray-100">Email</th>
                        <th className="px-4 py-2 text-center text-gray-600 bg-gray-100 min-w-[150px]">Date Read</th>
                        <th className="px-4 py-2 text-center text-gray-600 bg-gray-100 min-w-[150px]">Time Read</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((faculty: UserDocument & { readAt: string }) => (
                        <tr key={faculty._id} className="border-t">
                          <td className="px-4 py-2">{faculty.prefixName ? `${faculty.prefixName} ` : ''}{faculty.firstName} {faculty.lastName}{faculty.suffixName ? `, ${faculty.suffixName}` : ''}</td>
                          <td className="px-4 py-2">{faculty.email}</td>
                          <td className="px-4 py-2">{(new Date(faculty.readAt)).toLocaleDateString('en-PH', { year: "numeric", month: "short", day: "numeric" })}</td>
                          <td className="px-4 py-2">{(new Date(faculty.readAt)).toLocaleTimeString('en-PH', { hour12: true, hour: "numeric", minute: "numeric"})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ),
          confirmButtonText: renderToString(<div><PrintIcon display="inline" marginRight={8} />Print</div>),
          showCloseButton: true,
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          cancelButtonText: "Close",
          reverseButtons: true,
        })
          .then(({ isConfirmed }: { isConfirmed: boolean }) => {
            if (isConfirmed) {
              onPrintAttendance(selectedMemo?._id!)
            }
          })
      })
  }, [doctype, selectedMemo?._id, onPrintAttendance]);

  const onFacultyNonReaders = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo/notread', window.location.origin)
    url.searchParams.set('doctype', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    fetch(url)
      .then(response => response.json())
      .then(({ data }) => {
        Swal.fire({
          title: 'Faculties Not Read',
          html: renderToString(
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Faculty Members Who Did Not Read This Memorandum</h2>
              {data.length === 0 ? (
                <p className="text-center text-gray-500">All Faculty members have read this memorandum.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 bg-gray-100">Name</th>
                        <th className="px-4 py-2 text-left text-gray-600 bg-gray-100">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((faculty: UserDocument) => (
                        <tr key={faculty._id} className="border-t">
                          <td className="px-4 py-2">{faculty.prefixName ? `${faculty.prefixName} ` : ''}{faculty.firstName} {faculty.lastName}{faculty.suffixName ? `, ${faculty.suffixName}` : ''}</td>
                          <td className="px-4 py-2">{faculty.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ),
          confirmButtonText: 'Close',
        })
      })
  }, [doctype, selectedMemo?._id]);

  const onUnarchive = useCallback(() => {
    Swal.fire({
      title: 'Do you want to restore this archive?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, cancel',
      confirmButtonText: 'Yes, restore'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { success, error } = await unarchiveMemorandumLetter(doctype, selectedMemo?._id!, !selectedMemo?.departmentId)
          if (success) {
            Swal.fire({
              icon:'success',
              title: 'Archived!',
              text: 'Memorandum letter has been archived successfully.',
              confirmButtonText: 'Okay',
              showConfirmButton: true,
            })
            onBack()
            setTimeout(() => getData(), 100)
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: error,
              confirmButtonText: 'Okay',
              showConfirmButton: true,
            })
          }
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!',
            footer: 'Please try again later.'
          })
        }
      }
    })
  }, [selectedMemo, doctype, getData, onBack])

  const [viewLayout, setViewLayout] = useState<ViewLayout>("list");

  return (<>
    <div className="p-6">
      <h1 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? <>Archived Memorandums</> : <>Archived Letters</>}</h1>
      <div className="mt-3 flex flex-col lg:flex-row lg:flex-betweeen flex-wrap w-full min-w-[300px] lg:min-w-[800px] bg-white p-4 rounded-t-lg">
        <div className="flex flex-wrap">
          <label htmlFor="searchMemo" className="font-[500] mr-2 items-center flex">Search:</label>
          <input type="search" onChange={(e) => setSearch(e.target.value)} value={search} id="searchMemo" placeholder="Search Memorandum" className="border-2 max-w-64 border-gray-300 px-2 py-1 rounded" />
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
            { !loading && filteredData.length === 0 && <div className="text-center">No archived {doctype === DocumentType.Memo ? "memorandum" : "letter"}.</div>}
            { !loading && filteredData.map((memoLetter, i) => (
              <ThumbnailItemWithDepartment layout={viewLayout} withSignatureNames={memoLetter?.signatureNames} onClick={() => setSelectedMemo(memoLetter)} preparedByMe={memoLetter.isPreparedByMe} isPreparedBy={memoLetter.preparedByName} key={memoLetter._id} thumbnailSrc="/thumbnail-document.png" department={(memoLetter as any).departmentId?.name} label={memoLetter.title} createdAt={memoLetter.createdAt} updatedAt={memoLetter.updatedAt} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate isForIndividual={!!selectedMemo?.userId} role={Roles.Admin} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-between items-center gap-x-3 pr-2">
        <div className="flex items-center justify-start gap-x-3">
          {!selectedMemo?.userId && (<>
            <button type="button" className="rounded-lg bg-green-200 hover:bg-green-100 text-black px-3 py-1 ml-4" onClick={onFacultyReaders}><ListIcon display="inline" /> See Faculty Readers</button>
            <button type="button" className="rounded-lg bg-yellow-200 hover:bg-yellow-100 text-black px-3 py-1 ml-4" onClick={onFacultyNonReaders}><ListIcon display="inline" /> See Faculties Not Read</button>
          </>)}
          {!!selectedMemo?.userId && (
            <div>Read by recipient: <span className={!!selectedMemo?.isRead ? "text-green-500" : "text-gray-500"}>{!!selectedMemo?.isRead ? "Yes" : "No"}</span></div>
          )}
        </div>
        <div className="flex items-center justify-end gap-x-3">
          <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onUnarchive}><ResetIcon display="inline" /> Restore</button>
          <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onPrint}><PrintIcon display="inline" /> Print</button>
          <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={onBack}>Close</button>
        </div>
      </div>
    </OCSModal>
  </>)
}
