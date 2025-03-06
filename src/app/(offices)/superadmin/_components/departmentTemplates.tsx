'use client';
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, ESignatureDocument, Roles, TemplateDocument } from "@/lib/modelInterfaces";
import { ViewLayout } from "@/lib/types";
import clsx from "clsx";
import { GridViewIcon, KeyEscapeIcon, ListColumnsIcon, PlusIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddTemplate from "./addTemplate";
import EditTemplate from "./editTemplate";
import ThumbnailItem from "./thumbnailItem";

export default function DepartmentTemplates({
  doctype
}: Readonly<{
  doctype: DocumentType
}>) {
  const [loading, setLoading] = useState<boolean>(true)
  const [departments, setDepartments] = useState<DepartmentDocument[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDocument>()

  const getDepartmentData = useCallback(() => {
    setLoading(true)
    const url = new URL('/' + Roles.SuperAdmin + '/api/template/departments', window.location.origin)
    url.searchParams.set('doctype', doctype)
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => { setDepartments(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype])

  useEffect(() => {
    getDepartmentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctype])

  const templates = useMemo(() => !!selectedDepartment ? (doctype === DocumentType.Memo ? selectedDepartment.memoTemplates as TemplateDocument[] : selectedDepartment.letterTemplates as TemplateDocument[]) : [], [selectedDepartment, doctype])

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDocument>()
  const [openEditTemplate, setOpenEditTemplate] = useState<boolean>(false)
  const [openAddTemplate, setOpenAddTemplate] = useState<boolean>(false)

  const onBack = useCallback(() => {
    getDepartmentData();
    setSelectedDepartment(undefined)
    setSelectedTemplate(undefined)
    setOpenEditTemplate(false)
    setOpenAddTemplate(false)
  }, [getDepartmentData])

  const onAddCancel = useCallback(() => {
    setOpenAddTemplate(false)
  }, [])

  const [signatoriesList, setSignatoriesList] = useState<ESignatureDocument[]>([])

  useEffect(() => {
    const url = new URL('/' + Roles.SuperAdmin + '/api/signatories', window.location.origin);
    fetch(url)
      .then(res => res.json())
      .then(({ result }) => setSignatoriesList(result))
      .catch(console.log)
  }, [])

  const [viewLayout, setViewLayout] = useState<ViewLayout>("list");


  return (<>
    <div className="w-full">
      <h1 className="w-fit mx-auto text-2xl mt-4 font-[500]">Department {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} Templates</h1>
      {!!selectedDepartment && (<>
        <div className="border border-gray-300 bg-white p-4 rounded-xl mt-4 mx-4">
          <h2 className="text-2xl font-[500]">{selectedDepartment.name}</h2>
          <p className="text-gray-600">Number of {doctype === DocumentType.Memo ? "Memorandums" : "Letters"}: {selectedDepartment[doctype === DocumentType.Memo ? 'memoTemplates' : 'letterTemplates'].length}</p>
          <button type="button" onClick={() => onBack()} className="px-2 py-1 border rounded bg-gray-300 text-black my-2 mr-2"><KeyEscapeIcon display="inline" /> Back</button>
          <button type="button" onClick={() => setOpenAddTemplate(true)} className="px-2 py-1 border rounded bg-sky-500 text-black my-2"><PlusIcon display="inline" /> Add Template</button>
        </div>
      </>
      )}
      {!openAddTemplate && !openEditTemplate && (<>
        <div className="flex justify-end items-end pr-8">
          <button type="button" onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")} title={viewLayout === "grid" ? "List View" : "Grid View"} className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50">
            {viewLayout === "list" ? <GridViewIcon /> : <ListColumnsIcon />}
          </button>
        </div>
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
      </>)}
      {openEditTemplate && !openAddTemplate && !!selectedTemplate && (
        <EditTemplate template={selectedTemplate} doctype={doctype} signatoriesList={signatoriesList} onSave={(templateId: string) => onBack()} onCancel={onBack} />
      )}
      { openAddTemplate && !!selectedDepartment && (
        <AddTemplate department={selectedDepartment} doctype={doctype} signatoriesList={signatoriesList} onAdd={(templateId: string) => onBack()} onCancel={onAddCancel} />
      )}
    </div>
    <OCSModal title={selectedTemplate?.title} open={!!selectedTemplate && !openEditTemplate} onClose={() => !openEditTemplate && setSelectedTemplate(undefined)}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate role={Roles.SuperAdmin} htmlString={selectedTemplate?.content || ''} />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-end items-center gap-x-3 pr-2">
        <button type="button" className="rounded-lg bg-yellow-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={() => setOpenEditTemplate(true)}>Edit</button>
        <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={() => setSelectedTemplate(undefined)}>Close</button>
      </div>
    </OCSModal>
  </>)
}