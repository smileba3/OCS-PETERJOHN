'use client'

export function getSignatureIdsFromContent(content: string): string[]
{
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const signatories = doc.querySelectorAll("table[data-type='signatory']");
  const signatures: string[] = [];
  signatories.forEach((signatory) => {
    signatures.push(signatory.getAttribute('data-signatory-id') || '');
  });
  return signatures.filter((id) => !!id);
}