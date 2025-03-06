'use client';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePad({ refer = (referer: any) => {}, width = 500, height = 200 }: any) {
  return (
    <SignatureCanvas penColor='black' ref={refer} canvasProps={{width, height, className: 'sigCanvas bg-transparent'}} />
  )
}