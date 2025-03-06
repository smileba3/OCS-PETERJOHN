'use client';;
import { Roles } from "@/lib/modelInterfaces";
import { destroySession } from "@/lib/session";
import { HighestPosition } from "@/lib/types";
import { useSession } from "@/lib/useSession";
import clsx from "clsx";
import { Avatar, ListIcon, LogOutIcon, Menu, NotificationsIcon } from "evergreen-ui";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSidebar } from "./sidebar-context";

function photoBufferToPhoto(buffer: Buffer, type: string) {
  if (buffer.length > 0) {
    const blob = new Blob([buffer], { type })
    const objectURL = URL.createObjectURL(blob)
    return objectURL
  }
  return ''
}

async function getPhoto(photoId: string, setPhoto: (photoURL?: string) => void) {
  const url = new URL('/api/photo/' + photoId, window.location.origin)
  try {
    const response = await fetch(url)
    const { result } = await response.json()
    if (result) {
      setPhoto(photoBufferToPhoto(Buffer.from(result.file), result.type))
    } else {
      setPhoto()
    }
  } catch (e) {
    console.error(e)
  }
}

export default function HeaderComponent() {
  const { data: session, status, notifications, refresh } = useSession({ redirect: false })
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const [isShown, setIsShown] = useState<boolean|undefined>(undefined)
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])
  const pathname = usePathname()
  const toggleShown = useCallback(() => setIsShown(!isShown), [isShown])
  const signout = destroySession.bind(null, role as Roles)
  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])

  const [photo, setPhoto] = useState<string|undefined>()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.photo) {
      getPhoto(session!.user.photo as string, setPhoto)
    }
  }, [status, session])

  useEffect(() => {
    if (photo && photo.length > 0) {
      return () => {
        URL.revokeObjectURL(photo)
      }
    }
  }, [photo])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <header className="sticky right-0 top-0 w-full min-h-[70px] z-10">
      <nav className="mb-0 bg-white shadow h-full items-center">
        <div className="flex h-full gap-x-2 mb-3 flex-between items-center flex-nowrap pl-3 pr-8">
          <div className="flex-grow justify-start">
            <button type="button" title="Toggle Sidebar" onClick={toggleSidebar} className="flex-shrink flex items-center px-2 py-1 text-sm font-medium text-slate-800 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300">
              {status === "loading" && <div className="animate-pulse w-6 h-6 bg-black/50 rounded-full" />}
              {status === "authenticated" && <ListIcon />}
            </button>
          </div>
          <button onClick={toggleShown} className="flex-shrink flex flex-nowrap relative">
            {status === "loading" && (
              <>
              <div className="flex-grow justify-end text-right items-end flex flex-col space-y-2">
                <div className="h-4 w-40 animate-pulse bg-black/50 rounded-lg" />
                <div className="h-3 w-20 animate-pulse bg-black/50 rounded-lg" />
              </div>
              <div className="min-h-full items-center justify-center flex pl-2">
                <div className="animate-pulse bg-black/50 w-10 h-10 rounded-full"></div>
              </div>
              </>
            )}
            {status === 'authenticated' && (
              <>
              <div className="flex-grow justify-end text-right">
                <div className="text-sm font-semibold text-slate-800 uppercase">
                  {session?.user?.fullName}
                </div>
                <div className="text-xs text-slate-700 capitalize">
                  {session?.user?.role === Roles.Admin && (session?.user?.highestPosition === HighestPosition.President || session?.user?.highestPosition === HighestPosition.VicePresident) ? session?.user?.highestPosition : (session?.user?.role === Roles.SuperAdmin ? "Admin" : (
                    session?.user?.role === Roles.Admin ? 'Dean/Head' : 'Faculty/Staff'
                  ))}
                </div>
              </div>
              <div className="min-h-full items-center justify-center flex pl-2">
                <Avatar src={photo} name={session?.user?.fullName} size={40} />
              </div>
              <div className={
                clsx(
                  "top-full right-0 absolute mt-2 rounded-xl p-2 border border-slate-200 bg-white shadow-lg border-radius-md w-56",
                  isShown? "block" : "hidden",
                )
              }>
                <Menu>
                  {session?.user?.role !== Roles.SuperAdmin && (
                    <Menu.Group>
                      <Menu.Item
                        icon={NotificationsIcon}
                        onClick={() => { setIsShown(false); router.push("/" + role + '/notifications'); }}
                      >
                        Notifications ({notifications.filter(notification =>!notification.read).length})
                      </Menu.Item>
                    </Menu.Group>
                  )}
                  <Menu.Group>
                    <Menu.Item
                      icon={LogOutIcon}
                      onClick={onLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Group>
                </Menu>
              </div>
            </>
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}