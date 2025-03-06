'use client';;
import { saveIndividualTemplate, saveTemplate } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DepartmentDocument, DocumentType, ESignatureDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { Button, CrossIcon, SendMessageIcon, toaster } from 'evergreen-ui';
import { useCallback, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function AddTemplate({ withSignatories, department, doctype, signatoriesList, onAdd, onCancel }: { withSignatories?: boolean, department?: DepartmentDocument, doctype?: DocumentType, signatoriesList: ESignatureDocument[], onAdd: (templateId: string) => void, onCancel: () => void }) {
  const { status } = useSession({ redirect: false })

  const editorRef = useRef<any>(null);

  const [content, setContent] = useState<string>("");

  const onContentChange = useCallback((editor: any, content: string) => {
    setContent(content);
  }, []);

  const onSaveAsTemplate = useCallback(() => {
    Swal.fire({
      title: 'Enter ' + (doctype === DocumentType.Memo ? 'Memorandum' : 'Letter') + ' template title:',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: false,
    }).then(async ({ isConfirmed, value }) => {
      if (isConfirmed) {
        if (!value) {
          toaster.danger('Please enter a template title')
          return;
        }
        if (!department || !doctype) {
          // individual template
          const formData = new FormData()
          formData.append('title', value)
          formData.append('content', content)
          const { success, templateId, error } = await saveIndividualTemplate(formData)
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            onAdd && onAdd(templateId as string)
          }
        } else {
          const saveMyTemplate = saveTemplate.bind(null, department?._id || '', doctype)
          const formData = new FormData()
          formData.append('title', value)
          formData.append('content', content)
          const { success, templateId, error } = await saveMyTemplate(formData)
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            onAdd && onAdd(templateId as string)
          }
        }
      }
    })
  }, [doctype, onAdd, department, content])

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center mt-4">
      <div className="text-2xl font-[600] mb-2">
        Add Individual Template
        </div>
      <div className="flex items-center justify-center gap-x-4 mb-2">
        <Button iconBefore={SendMessageIcon} appearance="primary" onClick={onSaveAsTemplate}>Save {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} Template</Button>
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </div>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} onContent={onContentChange} withPreparedBy={false} withSignatories={!!withSignatories} />
    </div>
  );
}