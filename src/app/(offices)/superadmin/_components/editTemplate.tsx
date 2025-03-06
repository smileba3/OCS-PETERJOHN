'use client';;
import { updateTemplate } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSTinyMCE from '@/components/OCSTinyMCE';
import { DocumentType, ESignatureDocument, TemplateDocument } from '@/lib/modelInterfaces';
import { useSession } from '@/lib/useSession';
import { Button, CrossIcon, SendMessageIcon, toaster } from 'evergreen-ui';
import { useCallback, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function EditTemplate({ withSignatories, template, doctype, signatoriesList, onSave, onCancel, }: { withSignatories?: boolean, template?: TemplateDocument, doctype?: DocumentType, signatoriesList: ESignatureDocument[], onSave: (templateId: string) => void, onCancel: () => void }) {
  const { status } = useSession({ redirect: false })

  const editorRef = useRef<any>(null);
  const [content, setContent] = useState<string>("");

  const onSaveAsTemplate = useCallback(function () {
    if (!!template?._id) {
      Swal.fire({
        icon: 'question',
        title: 'Save changes to existing template?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: false,
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          if (!doctype) {
            // individual template
          } else {
            const saveMyTemplate = updateTemplate.bind(null, template?._id || '', doctype)
            const formData = new FormData()
            formData.append('content', content)
            const { success, error } = await saveMyTemplate(formData)
            if (error) {
              toaster.danger(error)
            } else if (success) {
              toaster.success(success)
              onSave && onSave(template._id as string)
            }
          }
        }
      })
    }
  }, [onSave, template?._id, doctype, content])

  const onContentChange = useCallback((editor: any, content: string) => {
    setContent(content);
  }, []);

  if (status === 'loading') return <LoadingComponent />;

  return (
    <div className="text-center">
      <div className="text-2xl font-[600]">
        Edit {doctype === DocumentType.Memo ? 'Memorandum' : 'Letter'} Template for {template?.title || "(unknown template)"}
      </div>
      <div className="flex items-center justify-center gap-x-4 mb-2">
        <Button iconBefore={SendMessageIcon} appearance="primary" onClick={onSaveAsTemplate}>Save {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} Template</Button>
        <button type="button" onClick={() => onCancel()} className="px-2 py-1 rounded bg-gray-300 text-black ml-4 font-normal text-sm"><CrossIcon display="inline" /> Cancel</button>
      </div>
      <OCSTinyMCE editorRef={editorRef} signatoriesList={signatoriesList} initialContentData={template?.content} onContent={onContentChange} withPreparedBy={false} withSignatories={!!withSignatories} />
    </div>
  );
}