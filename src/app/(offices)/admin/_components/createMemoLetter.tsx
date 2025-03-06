'use client';;
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, ESignatureDocument, Roles, TemplateDocument, UserDocument } from "@/lib/modelInterfaces";
import { HighestPosition, ViewLayout } from "@/lib/types";
import { useSession } from '@/lib/useSession';
import clsx from "clsx";
import { ArrowLeftIcon, GridViewIcon, KeyEscapeIcon, ListColumnsIcon, PlusIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import CreateFromTemplate from "./createFromTemplate";
import ThumbnailItem from "./thumbnailItem";

export default function CreateMemoLetterFromTemplate({
  doctype
}: Readonly<{
  doctype: DocumentType
}>) {
  const { data: sessionData } = useSession({ redirect: false });
  const [loading, setLoading] = useState<boolean>(true)
  const [departments, setDepartments] = useState<DepartmentDocument[]>([])
  const [employees, setEmployees] = useState<UserDocument[]>([])
  const [individualTemplates, setIndividualTemplates] = useState<TemplateDocument[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDocument>()
  const [selectedIndividual, setSelectedIndividual] = useState<UserDocument>()
  const [step, setStep] = useState<"individual"|"department"|undefined>()

  const isHighestPosition = useMemo(() => {
    const highestPosition = sessionData?.user?.highestPosition as HighestPosition|undefined;
    return highestPosition === HighestPosition.President || highestPosition === HighestPosition.VicePresident;
  }, [sessionData])

  const getDepartmentData = useCallback(() => {
    setLoading(true)
    const url = new URL('/' + Roles.Admin + '/api/template/departments', window.location.origin)
    url.searchParams.set('doctype', doctype)
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => { setDepartments(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype])

  const getIndividualTemplates = useCallback(() => {
    setLoading(true)
    const url = new URL('/' + Roles.Admin + '/api/template/individuals', window.location.origin)
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => { setIndividualTemplates(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [])

  const getEmployeesData = useCallback(() => {
    setLoading(true)
    const url = new URL('/' + Roles.Admin + '/api/account/employees', window.location.origin)
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => { setEmployees(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [])

  useEffect(() => {
    getDepartmentData()
    getIndividualTemplates()
    getEmployeesData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctype])

  const templates = useMemo(() => !!selectedDepartment ? (doctype === DocumentType.Memo ? selectedDepartment.memoTemplates as TemplateDocument[] : selectedDepartment.letterTemplates as TemplateDocument[]) : [], [selectedDepartment, doctype])

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDocument>()
  const [openAddTemplate, setOpenAddTemplate] = useState<boolean>(false)

  const onBack = useCallback(() => {
    getDepartmentData();
    setSelectedDepartment(undefined)
    setSelectedTemplate(undefined)
    setSelectedIndividual(undefined)
    setOpenAddTemplate(false)
  }, [getDepartmentData])

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
    const afterSig = (
      // !!selectedDepartment
      // ?
      signatoriesList.sort((a: ESignatureDocument & { adminId: UserDocument } | any, b: ESignatureDocument & { adminId: UserDocument } | any) => {
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
      // : (!!selectedIndividual
      //     ? signatoriesList.filter((signatory: ESignatureDocument & { adminId: UserDocument } | any) => {
      //         return signatory.adminId?._id?.toString() === sessionData?.user?._id?.toString()
      //       })
      //     : []
      // )
    )
    return afterSig;
  }, [
    selectedDepartment, signatoriesList,
    // selectedIndividual, sessionData
  ]);

  const onChangeSelectedIndividual = useCallback((id: string) => {
    setSelectedIndividual(employees.find((d) => d._id === id) || undefined)
  }, [employees])

  const [viewLayout, setViewLayout] = useState<ViewLayout>("list");

  return (<>
    <div className="w-full relative">
      <h1 className="w-fit mx-auto text-2xl mt-4 font-[500]">{doctype === DocumentType.Memo ? "Memorandum" : "Letter"} Templates</h1>
      {!step ? (
        <div className="h-[calc(100vh-200px)] flex justify-evenly items-center">
          <button className="p-16 bg-yellow-500 text-2xl rounded-lg" onClick={() => setStep("individual")}>Send to Individual</button>
          <button className="p-16 bg-blue-500 text-2xl rounded-lg" onClick={() => setStep("department")}>Send to Department</button>
        </div>
      ) : (<>
      <button className="absolute left-2 top-2" onClick={() => setStep(undefined)}><ArrowLeftIcon display="inline" /> <span className="hover:underline">Back</span></button>
      {step === "department" && !!selectedDepartment && (
        <>
          <div className="border border-gray-300 bg-white p-4 rounded-xl mt-4 mx-4">
            <h2 className="text-2xl font-[500]">{selectedDepartment.name}</h2>
            <p className="text-gray-600">Number of {doctype === DocumentType.Memo ? "Memorandums" : "Letters"}: {selectedDepartment[doctype === DocumentType.Memo ? 'memoTemplates' : 'letterTemplates'].length}</p>
            <button type="button" onClick={() => onBack()} className="px-2 py-1 border rounded bg-gray-300 text-black my-2 mr-2"><KeyEscapeIcon display="inline" /> Back</button>
            <button type="button" onClick={() => setOpenAddTemplate(true)} className="px-2 py-1 border rounded bg-sky-300 text-black font-[500] my-2"><PlusIcon display="inline" /> Create from empty template</button>
          </div>
        </>
      )}
      {step === "individual" && !!selectedIndividual && (
        <>
          <div className="border border-gray-300 bg-white p-4 rounded-xl mt-4 mx-4">
            <h2 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? "Memorandums" : "Letters"} for {selectedIndividual.firstName + " " + selectedIndividual.lastName}</h2>
            <p className="text-gray-600">Number of {doctype === DocumentType.Memo ? "Memorandums" : "Letters"}: {individualTemplates.length}</p>
            <button type="button" onClick={() => onBack()} className="px-2 py-1 border rounded bg-gray-300 text-black my-2 mr-2"><KeyEscapeIcon display="inline" /> Back</button>
            <button type="button" onClick={() => setOpenAddTemplate(true)} className="px-2 py-1 border rounded bg-sky-300 text-black font-[500] my-2"><PlusIcon display="inline" /> Create from empty template</button>
          </div>
        </>
      )}
      {step === "individual" &&  !openAddTemplate && (<>
        <div className="w-full mt-2">
          {loading && <div className="col-span-2 min-h-[200px]"><LoadingComponent /></div>}
          {!loading && !!selectedIndividual && (
            <div className="flex justify-between items-end px-8 pt-4">
              <h1 className="text-center font-semibold text-xl">Send {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} to Individual</h1>
              <button type="button" onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")} title={viewLayout === "grid" ? "List View" : "Grid View"} className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50">
                {viewLayout === "list" ? <GridViewIcon /> : <ListColumnsIcon />}
              </button>
            </div>
          )}
          {!loading && !selectedIndividual && employees?.length === 0 && <p className="text-center text-gray-600">No Employees/Faculty/Staff</p>}
          {!loading && !selectedIndividual && (
            <div className="w-full h-[calc(100vh-300px)] flex flex-col justify-center items-center">
              <label className="text-xl font-bold">Select Recipient:</label>
              <select className="px-3 py-2 text-lg bg-white rounded shadow mx-auto flex mt-2" value={(selectedIndividual as UserDocument|undefined)?._id} onChange={(e) => onChangeSelectedIndividual(e.target.value)} >
                <option value="">-- Select Individual --</option>
                {employees.filter((employee) => !!sessionData && employee._id !== sessionData.user?._id)?.map((employee) => (
                  <option key={employee._id + "Employee"} value={employee._id}>{employee.firstName} {employee.lastName}</option>
                ))}
              </select>
            </div>
          )}
          {!loading && !!selectedIndividual && (<>
            <div className={clsx(viewLayout === "grid" ? "grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] p-3 gap-3" : "w-full grid grid-cols-1 gap-2")}>
              {!loading && !!selectedIndividual && individualTemplates.length === 0 && <p className="text-center text-gray-600">No Individual Templates</p>}
              {!loading && !!selectedIndividual && individualTemplates.map((template: TemplateDocument) => (
                <ThumbnailItem layout={viewLayout} key={template._id} thumbnailSrc={"/thumbnail-document.png"} onClick={() => setSelectedTemplate(template)} label={template.title} createdAt={template.createdAt} updatedAt={template.updatedAt} />
              ))}
            </div>
          </>)}
        </div>
      </>)}
      { (!!selectedDepartment && !selectedIndividual) && !openAddTemplate && (
        <div className="flex justify-between items-end pr-8">
          <h1 className="pl-4 mt-8 text-xl font-[600]">Create {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} from template</h1>
          <button type="button" onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")} title={viewLayout === "grid" ? "List View" : "Grid View"} className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50">
            {viewLayout === "list" ? <GridViewIcon /> : <ListColumnsIcon />}
          </button>
        </div>
      )}
      { step === "department" && !openAddTemplate && (
        <div className={clsx(viewLayout === "grid" ? "grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] p-3 gap-3" : "w-full grid grid-cols-1 gap-2")}>
          {loading && <div className="col-span-2 min-h-[200px]"><LoadingComponent /></div>}
          {!loading && !selectedDepartment && departments?.length === 0 && <p className="text-center text-gray-600">No Departments</p>}
          {!loading && !selectedDepartment && departments?.map((department: DepartmentDocument) => (
            <div key={department._id} className="mx-auto">
              <button type="button" onClick={() => setSelectedDepartment(department)} title={department.name} className="shadow-lg border border-gray-300 bg-white p-4 rounded-xl cursor-pointer hover:border-gray-400 flex flex-col items-start justify-center text-center">
                <div className="w-full">{doctype === DocumentType.Memo ? department.memoTemplates.length : department.letterTemplates.length} Templates</div>
                <div className="w-full font-semibold">{department.name}</div>
              </button>
            </div>
          ))}
          {!loading && !!selectedDepartment && templates.length === 0 && <p className="text-center text-gray-600">No Templates</p>}
          {!loading && !!selectedDepartment && templates.map((template: TemplateDocument) => (
            <ThumbnailItem layout={viewLayout} key={template._id} thumbnailSrc={"/thumbnail-document.png"} onClick={() => setSelectedTemplate(template)} label={template.title} createdAt={template.createdAt} updatedAt={template.updatedAt} />
          ))}
        </div>
      )}
      { !!openAddTemplate && (!!selectedDepartment || !!selectedIndividual) && (
        <CreateFromTemplate isHighestPosition={isHighestPosition} individual={selectedIndividual} departmentId={selectedDepartment?._id} template={selectedTemplate} doctype={doctype} signatoriesList={selectedSignatoriesList} onSave={(templateId: string) => onBack()} onCancel={onBack} />
      )}
      </>)}
    </div>
    <OCSModal title={selectedTemplate?.title} open={!!selectedTemplate && !openAddTemplate} onClose={() => !openAddTemplate && setSelectedTemplate(undefined)}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate role={Roles.Admin} htmlString={selectedTemplate?.content || ''} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-end items-center gap-x-3 pr-2">
        <button type="button" className="rounded-lg bg-yellow-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={() => setOpenAddTemplate(true)}><PlusIcon display="inline" /> Create from Template</button>
        <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={() => setSelectedTemplate(undefined)}>Close</button>
      </div>
    </OCSModal>
  </>)
}