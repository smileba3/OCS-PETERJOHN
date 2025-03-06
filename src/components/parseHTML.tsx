'use client'

import { ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import { Image } from "evergreen-ui";
import { useCallback, useEffect, useState } from "react";
import jsxToString from "./JSXToString";
import LoadingComponent from "./loading";

export default function ParseHTMLTemplate({ isForIndividual, role, htmlString, showApprovedSignatories = false, memoLetterId, print = false }: { isForIndividual?: boolean, role: Roles, htmlString: string, showApprovedSignatories?: boolean, memoLetterId?: string, print?: boolean }) {
  const [htmlFinal, setHTMLFinal] = useState<string|undefined>();
  const [loading, setLoading] = useState<boolean>(true)
  const getPreparedBySignature = useCallback(async () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return new Promise((resolve: (value?: any) => void, reject: (error?: any) => void) => {
      const preparedByElem = doc.querySelector("table[data-type='prepared-by']")
      const preparedBy = preparedByElem?.getAttribute('data-signatory-id')
      if (!!preparedBy && !!memoLetterId) {
        const url = new URL('/' + role + '/api/memo/preparedby', window.location.origin)
        url.searchParams.set('mlid', memoLetterId || '')
        if (!!isForIndividual) {
          url.searchParams.set('isForIndividual', 'true');
        }
        fetch(url)
        .then(response => response.json())
        .then(({ result }) => {
          // get prepared by signature
          if (!!result) {
            const parser = new DOMParser();
            const pbname = preparedByElem!.querySelector("td[data-type='prepared-by-name']")
            if (!pbname?.classList.contains('relative')) {
              pbname?.classList.add("relative")
            }
            if (pbname?.firstElementChild?.getAttribute('data-is-signature') === "true") {
              const img = pbname.firstElementChild.firstElementChild
              img?.setAttribute('src', result.signature || '')
            } else {
              const absoluteSignature = jsxToString(
                <div className="absolute w-full left-0 bottom-1/4 z-50" data-is-signature="true">
                  <Image src={result.signature || ''} alt="preparedBy" className="max-h-[50px] mx-auto" />
                </div>
              )
              const parsed = parser.parseFromString(absoluteSignature, "text/html")
              pbname?.prepend(parsed.body.children[0])
            }
          }
          resolve(doc.documentElement.innerHTML)
        })
        .catch(reject)
      } else {
        resolve(doc.documentElement.innerHTML)
      }
    })
  }, [role, memoLetterId, htmlString, isForIndividual])

  const getApprovedSignatures = useCallback(async (htmlDocString: string) => {
    return new Promise((resolve: (value?:any) => void, reject: (error?: any) => void) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlDocString, "text/html");
      if (showApprovedSignatories && !!memoLetterId) {
        const url = new URL('/' + role + '/api/memo/signatory', window.location.origin)
        url.searchParams.set('mlid', memoLetterId || '')
        if (!!isForIndividual) {
          url.searchParams.set('isForIndividual', 'true');
        }
        fetch(url)
        .then(response => response.json())
        .then(({ result }) => { resolve({ htmlDocString: htmlDoc.documentElement.innerHTML, approvedSignatories: result }) })
        .catch(reject)
      } else {
        resolve({ htmlDocString: htmlDoc.documentElement.innerHTML, approvedSignatories: [] })
      }
    })
  }, [showApprovedSignatories, role, memoLetterId, isForIndividual])

  const getData = useCallback(async ({ htmlDocString, approvedSignatories }: { htmlDocString: string, approvedSignatories: ESignatureDocument[] }) => {
    return new Promise(async (resolve: (value?: any) => void, reject: (error?: any) => void) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlDocString, "text/html");
      // get approved signatures
      if (approvedSignatories?.length > 0 && showApprovedSignatories) {
        const signatories = htmlDoc?.querySelectorAll("table[data-type='signatory']")
        if (!!signatories && signatories.length > 0) {
          try {
            await Promise.all(Object.entries(signatories).map(async ([index, signatory]) => {
              const signatoryId = signatory.getAttribute('data-signatory-id')
              const signature = approvedSignatories.find((s) => s._id === signatoryId)
              if (!!signature) {
                const sname = signatory.querySelector("td[data-type='signatory-name']")
                if (!sname?.classList.contains('relative')) {
                  sname?.classList.add("relative")
                }
                if (sname?.firstElementChild?.getAttribute('data-is-signature') === "true") {
                  const img = sname.firstElementChild.firstElementChild
                  img?.setAttribute('src', signature.signature || '')
                } else {
                  const absoluteSignature = jsxToString(
                    <div className="absolute w-full left-0 bottom-1/4 z-50" data-is-signature="true">
                      <Image src={signature.signature || ''} alt="preparedBy" className="max-h-[50px] mx-auto" />
                    </div>
                  )
                  const parsed = parser.parseFromString(absoluteSignature, "text/html")
                  sname?.prepend(parsed.body.children[0])
                }
              }
            }))
            resolve(htmlDoc.documentElement.innerHTML)
          } catch (e) {
            reject(e)
          }
        } else {
          resolve(htmlDocString)
        }
      } else {
        resolve(htmlDocString)
      }
    })
  }, [showApprovedSignatories])

  useEffect(() => {
    if (!!htmlString) {
      setLoading(true)
      getPreparedBySignature()
      .then(getApprovedSignatures)
      .then(getData)
      .then(async (htmlDoc) => setHTMLFinal(htmlDoc))
      .then(() => setLoading(false))
      .catch(console.log)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlString])

  return !!htmlString && !print ? (
    <div style={{
      width: 11 * 96,
      height: 11 * 96,
      maxHeight: "80vh",
      overflow: "auto",
      border: "1px solid #e5e7eb",
      paddingTop: "16px",
      paddingBottom: "16px",
    }}>
      { !loading && (
        <div style={{ maxWidth: 8.5 * 96, minHeight: 11 * 96, backgroundColor: "white" }} className="border shadow mx-auto p-[12.2mm]">
          <div dangerouslySetInnerHTML={{ __html: htmlFinal || '' }} />
        </div>
      )}
      { loading && (
        <LoadingComponent />
      )}
    </div>
  ) : (!!htmlString && print ? (
    <div style={{ maxWidth: 8.5 * 96, minHeight: 11 * 96, backgroundColor: "white" }} className="border shadow mx-auto p-[12.2mm]">
      <div dangerouslySetInnerHTML={{ __html: htmlFinal || '' }} />
    </div>
  ) : undefined)
}