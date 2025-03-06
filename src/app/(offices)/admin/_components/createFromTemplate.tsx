'use client';
import { saveMemorandumLetter, saveMemorandumLetterToIndividual } from '@/actions/admin';
import { getSignatureIdsFromContent } from '@/components/getSignatureIdsFromContent';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DocumentType, ESignatureDocument, Roles, TemplateDocument, UserDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { Button, CrossIcon, Icon, SelectMenu, SendMessageIcon, toaster } from 'evergreen-ui';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function CreateFromTemplate({ editingId, rejectedId = null, departmentId, individual, template, doctype, signatoriesList, isHighestPosition, onSave, onCancel }: { editingId?: string, rejectedId?: string|null, departmentId?: string, individual?: UserDocument, template?: TemplateDocument, doctype: DocumentType, isHighestPosition?: boolean, signatoriesList: ESignatureDocument[], onSave: (memoradumId: string) => void, onCancel: () => void }) {
  const { status, data: sessionData } = useSession({ redirect: false })
  // const ppi = 96
  // const size = useMemo<{width:number, height:number}>(() => ({
  //   width: 8.5 * ppi,
  //   height: 11 * ppi,
  // }), []);
  const [cc, setCC] = useState<string[]>([])
  const [options, setOptions] = useState<{ label: string, value: string }[]>([])

  const saveMyTemplateIndiv = useMemo(() => saveMemorandumLetterToIndividual.bind(null, individual?._id || '', doctype), [individual, doctype]);
  const saveMyTemplateDept = useMemo(() => saveMemorandumLetter.bind(null, departmentId || '', doctype, rejectedId), [doctype, departmentId, rejectedId])

  const getFullName = useCallback((user?: UserDocument): string => {
    const fn = (user?.prefixName || '') + ' ' + user?.firstName + ' ' + (!!user?.middleName ? user?.middleName[0].toUpperCase() + '. ' : '') + user?.lastName + (user?.suffixName? ', ' + user?.suffixName : '')
    return fn.trim()
  }, [])

  const fetchAllUsers = useCallback(() => {
    const url = new URL("/" + Roles.Admin + "/api/cc/users", window.location.origin);
    fetch(url)
      .then((response) => response.json())
      .then(({ result }) => setOptions(result.map((user: UserDocument) => ({ label: user.employeeId + " - " + getFullName(user), value: user._id }))))
      .catch(console.log)
  }, [getFullName])

  useEffect(() => {
    fetchAllUsers()
    // eslint-disable-next-line
  }, [])

  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<string>("");

  const [series, setSeries] = useState<string>("");

  const onContentChange = useCallback((editor: any, content: string) => {
    setContent(content);
  }, []);

  const onSaveAsTemplate = useCallback(() => {
    if (!!individual) {
      Swal.fire({
        icon: 'question',
        title: 'Send ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' to ' + individual?.firstName + " " + individual?.lastName + "?",
        text: 'This ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' will be sent with your approved signature. Are you sure you want to send?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Send it',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          Swal.fire({
            title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title:',
            input: 'text',
            inputValue: template?.title || '',
            showCancelButton: true,
            confirmButtonText: 'Confirm and Send',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: false,
          }).then(async ({ isConfirmed, value }) => {
            if (isConfirmed) {
              if (!value) {
                toaster.danger('Please enter a ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title')
                return;
              }
              const eSignatures = getSignatureIdsFromContent(content);
              const formData = new FormData()
              formData.append('title', value)
              formData.append('content', content)
              formData.append('series', series)
              const { success, memorandumId, letterId, error } = await saveMyTemplateIndiv(cc, eSignatures, formData)
              if (error) {
                toaster.danger(error)
              } else if (success) {
                toaster.success(success)
                onSave && doctype === DocumentType.Memo && onSave(memorandumId as string)
                onSave && doctype === DocumentType.Letter && onSave(letterId as string)
              }
            }
          })
        }
      })
    } else if (!!departmentId) {
      Swal.fire({
        icon: 'question',
        title: 'Save and Submit ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + '?',
        text: 'Once saved, this ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' will be submitted for approval. Are you sure you want to save?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Submit and Save',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          if (!!rejectedId) {
            const eSignatures = getSignatureIdsFromContent(content);
            const formData = new FormData()
            formData.append('content', content)
            const { success, memorandumId, letterId, error } = await saveMyTemplateDept(cc, eSignatures, formData)
            if (error) {
              toaster.danger(error)
            } else if (success) {
              toaster.success(success)
              onSave && doctype === DocumentType.Memo && onSave(memorandumId as string)
              onSave && doctype === DocumentType.Letter && onSave(letterId as string)
            }
          } else {
            Swal.fire({
              title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title:',
              input: 'text',
              inputValue: template?.title || '',
              showCancelButton: true,
              confirmButtonText: 'Submit and Send',
              cancelButtonText: 'Cancel',
              showLoaderOnConfirm: false,
            }).then(async ({ isConfirmed, value: title }) => {
              if (isConfirmed) {
                if (!title) {
                  toaster.danger('Please enter a ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' title')
                  return;
                }
                const eSignatures = getSignatureIdsFromContent(content);
                const formData = new FormData()
                formData.append('title', title)
                formData.append('content', content)
                formData.append('series', series)
                const { success, memorandumId, letterId, error } = await saveMyTemplateDept(cc, eSignatures, formData)
                if (error) {
                  toaster.danger(error)
                } else if (success) {
                  toaster.success(success)
                  onSave && doctype === DocumentType.Memo && onSave(memorandumId as string)
                  onSave && doctype === DocumentType.Letter && onSave(letterId as string)
                }
              }
            })
          }
        }
      })
    }
  }, [onSave, departmentId, doctype, template?.title, individual, cc, content, saveMyTemplateDept, saveMyTemplateIndiv, series, rejectedId])
  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <div className="text-2xl font-[600]">
        {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} - {template?.title || "(new)"}
      </div>
      <div className="flex items-center justify-center gap-x-4">
        <Button iconBefore={SendMessageIcon} appearance="primary" onClick={onSaveAsTemplate}>Save and Send {doctype === DocumentType.Memo ? "Memorandum" : "Letter"}</Button>
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </div>
      <div className="my-3 text-left px-16 w-full py-2">
        <span>
          Carbon Copy (CC):&nbsp;
        </span>
        <SelectMenu
          isMultiSelect
          title="Select CC"
          options={options}
          selected={cc}
          onSelect={(item: any) => {
            const selected = [...cc, item.value]
            const selectedItems = selected
            setCC(selectedItems)
          }}
          onDeselect={(item: any) => {
            const selectedItems = cc.filter((sel_item) => sel_item == item.value)
            setCC(selectedItems)
          }}
        >
          <div className="inline-flex p-4 rounded bg-white w-full">
            {cc.length === 0
              ? <div>No CC Selected</div>
              : <div className="flex justify-start items-center gap-x-2 min-h-[30px] h-[30px] max-h-[30px]">
                  {cc.map((c: string, i: number) => (
                    <Fragment key={'cc_' + i}>
                      <div className="bg-gray-200 hover:bg-gray-100 py-1 text-black px-3 rounded-lg h-fit text-left text-sm flex justify-between items-center">
                        <div>
                          {options.find((v: {label: string, value: string }) => v.value === c)?.label?.split(" - ")?.[1]}
                        </div>
                        <div className="flex-shrink">
                          <Icon
                            icon={<CrossIcon display="inline" />}
                            marginLeft={6}
                            size={12}
                            className="text-red-600 hover:text-red-400"
                            onClick={(e) => {
                              e.preventDefault();
                              const selectedItems = cc.filter((sel_item) => sel_item !== c)
                              setCC(selectedItems)
                            }}
                          />
                        </div>
                      </div>
                      {i+1 < cc.length && (<div>,</div>)}
                    </Fragment>
                  ))}
                </div>
            }
          </div>
        </SelectMenu>
      </div>
      <OCSTinyMCE editorRef={editorRef} onSeries={setSeries} departmentId={!individual ? departmentId : undefined} fullName={sessionData?.user?.fullName} doctype={doctype} signatoriesList={signatoriesList} initialContentData={template?.content} onContent={onContentChange} withPreparedBy withSignatories />
    </div>
  );
}