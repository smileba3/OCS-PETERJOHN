'use client';;
import { archiveMemorandumLetter, forwardMemorandumLetter } from "@/actions/faculty";
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, LetterDocument, MemoDocument, ReadLetterDocument, ReadMemoDocument, Roles, SignatureApprovals, UserDocument } from "@/lib/modelInterfaces";
import { ViewLayout } from "@/lib/types";
import { useSession } from "@/lib/useSession";
import clsx from "clsx";
import { ArchiveIcon, FastForwardIcon, GridViewIcon, ListColumnsIcon, PrintIcon, RefreshIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import ThumbnailItemWithDepartment from "./thumbnailItemWithDepartment";

export default function MemoLetterInbox({ doctype, searchParam }: Readonly<{ doctype: DocumentType, searchParam: string }>) {
  const { data: sessionData } = useSession({ redirect: false });
  const [data, setData] = useState<(MemoDocument & { isPreparedByMe: boolean, isRead: boolean })[]|(LetterDocument & { isPreparedByMe: boolean, isRead: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument) & { isPreparedByMe: boolean }>();
  const [myUser, setMyUser] = useState<UserDocument>()
  const [allUsers, setAllUsers] = useState<{ [department: string]: {
    department: DepartmentDocument,
    users: (UserDocument & { signatureId: string|null })[],
  }}>({})
  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Faculty + '/api/memo', window.location.origin)
    url.searchParams.set('doctype', doctype)
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result, user }) => { setMyUser(user); setData(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  const fetchAllUsers = useCallback(() => {
    const url = new URL('/' + Roles.Faculty + '/api/users', window.location.origin)
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => { setAllUsers(result); })
      .catch((e) => { console.log(e) })
  }, [])

  useEffect(() => {
    getData();
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBack = useCallback(() => {
    setSelectedMemo(undefined);
  }, [])

  const [search, setSearch] = useState<string>(searchParam || '')
  const filteredData = useMemo(() => {
    let filtered: any = [...data as any];
    if (search) {
      filtered = data.filter((item: any) => (
        item._id!.toLowerCase() === search.toLowerCase()
        || item.title.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument)?.name.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument)?.name.toLowerCase() === search.toLowerCase()
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
    return filtered.map((item: any) => ({
      ...item,
      isRead: !!item.userId ? item.isRead : doctype === DocumentType.Memo
        ? [...(myUser?.readMemos?.map((v: ReadMemoDocument) => v.memoId) || [])]?.includes(item._id?.toString())
        : [...(myUser?.readLetters?.map((v: ReadLetterDocument) => v.letterId) || [])]?.includes(item._id?.toString()),
    }));
  }, [data, search, myUser, doctype])

  const onPrint = useCallback(() => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    url.searchParams.set('role', Roles.Admin)
    url.searchParams.set('title', selectedMemo?.title!)
    if ((selectedMemo as any)?.userId) {
      url.searchParams.set('isForIndividual', 'true');
    }
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype, selectedMemo])

  const onReadMemoLetter = useCallback((memoLetter: (MemoDocument & { isPreparedByMe: boolean, isRead: boolean, userId?: string })|(LetterDocument & { isPreparedByMe: boolean, isRead: boolean, userId?: string })) => {
    const url = new URL('/' + Roles.Faculty + '/api/memo/read', window.location.origin)
    url.searchParams.set('id', memoLetter._id!)
    url.searchParams.set('doctype', doctype)
    if (!!memoLetter?.userId) {
      url.searchParams.set('isForIndividual', "true");
    }
    fetch(url)
      .then((response) => response.json())
      .then(({ success, error }) => {
        console.log("success",success);
        console.log("error",error);
      })
      .catch(console.log);
    setSelectedMemo(memoLetter);
  }, [doctype])

  const onArchive = useCallback(() => {
    Swal.fire({
      title: 'Do you want to archive this?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, cancel',
      confirmButtonText: 'Yes, archive'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { success, error } = await archiveMemorandumLetter(doctype, selectedMemo?._id!, !selectedMemo?.departmentId)
          if (success) {
            Swal.fire({
              icon:'success',
              title: 'Archived!',
              text: 'Letter has been archived successfully.',
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

  const getFullName = useCallback((user?: UserDocument): string => {
    const fn = (user?.prefixName || '') + ' ' + user?.firstName + ' ' + (!!user?.middleName ? user?.middleName[0].toUpperCase() + '. ' : '') + user?.lastName + (user?.suffixName? ', ' + user?.suffixName : '')
    return fn.trim()
  }, [])

  const onForwardTo = useCallback(() => {
    Swal.fire({
      title: 'Forward to:',
      input: 'select',
      inputOptions: Object.keys(allUsers).reduce((caller: any, val: string) => {
        caller[val] = allUsers[val].department.name;
        return caller;
      }, {}),
      inputLabel: "Select Department",
      inputPlaceholder: 'Select department',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'cancel',
      confirmButtonText: 'Next',
      preConfirm(input: string) {
        if (!input) {
          Swal.showValidationMessage('Please select a department.')
          return null
        }
        return input;
      }
    }).then(({ isConfirmed, value: departmentId }) => {
      if (isConfirmed) {
        let isIndividual = false
        // then select all users from departmentId
        const inMemo = [selectedMemo?.preparedBy, ...(selectedMemo?.cc || []), sessionData?.user?._id]
        if (!(selectedMemo as any)?.userId) {
          const allESignatures: string[] = (selectedMemo?.signatureApprovals as SignatureApprovals[]).map((sa) => sa.signature_id as string)
          const inMemoSignatures = allUsers[departmentId].users.filter(user => !!user.signatureId && allESignatures.includes(user.signatureId)).map((user) => user._id)
          inMemoSignatures.concat(inMemoSignatures)
        } else {
          isIndividual = true
          if (!inMemo.includes((selectedMemo as any).userId)) {
            inMemo.push((selectedMemo as any).userId)
          }
        }
        Swal.fire({
          title: 'Forward to:',
          input: 'select',
          inputOptions: allUsers[departmentId].users.reduce((caller: any, user: UserDocument & { signatureId: string|null }) => {
            const userId: string = user?._id?.toString() || ""
            if (!inMemo.includes(user._id)) {
              caller[userId] = getFullName(user)
            }
            return caller;
          }, {}),
          inputLabel: "Select Forward to:",
          inputPlaceholder: 'Select Forward to:',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          cancelButtonText: 'cancel',
          confirmButtonText: 'Next',
          preConfirm(input: string) {
            if (!input) {
              Swal.showValidationMessage('Please select a user.')
              return null
            }
            return input;
          }
        })
          .then(async ({ isConfirmed, value: userId }) => {
            if (isConfirmed) {
              const { success, error } = await forwardMemorandumLetter(selectedMemo!._id!, doctype, userId, isIndividual)
              if (success) {
                Swal.fire({
                  icon:'success',
                  title: 'Forwarded!',
                  text: 'It has been forwarded successfully.',
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
            }
          })
      }
    })
  }, [allUsers, selectedMemo, getFullName, sessionData, getData, onBack, doctype])

  const [viewLayout, setViewLayout] = useState<ViewLayout>("list");

  return (<>
    <div className="p-6">
      <h1 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? "Approved Memorandum" : "Approved Letter"}</h1>
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
            { !loading && filteredData.length === 0 && <div className="text-center">No approved {doctype === DocumentType.Memo ? "memorandum" : "letter"}.</div>}
            { !loading && filteredData.map((memoLetter: any, i: any) => (
              <ThumbnailItemWithDepartment layout={viewLayout} withSignatureNames={memoLetter?.signatureNames} series={memoLetter?.series} onClick={() => onReadMemoLetter(memoLetter)} preparedByMe={false} isPreparedBy={memoLetter.preparedByName} isRead={memoLetter.isRead} key={memoLetter._id || "myid_" + i} thumbnailSrc="/thumbnail-document.png" department={(memoLetter.departmentId as DepartmentDocument)?.name} label={memoLetter.title} createdAt={memoLetter.createdAt} updatedAt={memoLetter.updatedAt} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate isForIndividual={!!(selectedMemo as any)?.userId} role={Roles.Faculty} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-end items-center gap-x-3 pr-2">
        {/* <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onArchive}><ArchiveIcon display="inline" /> Archive</button> */}
        <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onForwardTo}><FastForwardIcon display="inline" /> Forward To</button>
        <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onPrint}><PrintIcon display="inline" /> Print</button>
        <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1 mr-4" onClick={onBack}>Close</button>
      </div>
    </OCSModal>
  </>)
}
