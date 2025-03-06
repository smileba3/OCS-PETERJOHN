'use client'

import clsx from "clsx"
import { CrossIcon } from "evergreen-ui"
import { useCallback, useEffect, useState } from "react"

export default function OCSModal({
  title,
  open,
  onClose,
  allowOutsideClick = true,
  children
}: Readonly<{
  children: React.ReactNode
  title: string|React.ReactNode
  onClose: () => void
  allowOutsideClick?: boolean
  open?: boolean
}>) {
  const [openModal, setOpenModal] = useState(open || false);
  const onModalClose = useCallback(() => {
    setOpenModal(false)
    onClose && onClose()
  }, [onClose])

  useEffect(() => {
    if (open !== undefined) {
      setOpenModal(open)
      if (!open) {
        onClose && onClose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return (
    <div
      className={
        clsx(
          "z-40 fixed left-0 top-0 w-full min-h-screen h-full",
          openModal ? "block" : "hidden",
        )
      }
    >
      <div className="relative h-full w-full flex justify-center items-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900/50" onClick={() => allowOutsideClick && onModalClose()} />
        <div className="z-50">
          <div className="bg-white rounded-lg p-2 shadow shadow-blue-500">
            <div className="px-2 py-1 flex flex-nowrap justify-between">
              <div className="text-[22px] font-[600]">
                {title}
              </div>
              <div className="flex-shrink">
                <button type="button" title="Close" className="p-1 shadow-md text-[14px] font-[600] text-red-800 rounded-full hover:text-white hover:bg-red-700 aspect-square" onClick={() => onClose()}>
                  <CrossIcon />
                </button>
              </div>
            </div>
            <div className="min-h-[100px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}