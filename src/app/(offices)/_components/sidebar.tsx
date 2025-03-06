'use client';
import { Roles } from "@/lib/modelInterfaces";
import { destroySession } from "@/lib/session";
import { useSession } from "@/lib/useSession";
import clsx from "clsx";
import { LogOutIcon } from "evergreen-ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useSidebar } from "./sidebar-context";
import smccLogo from "./smcc-logo.webp";

export default function SidebarComponent() {
  const { status: sessionStatus } = useSession({ redirect: false })
  const { isSidebarOpen, sidebarNavigations, user } = useSidebar();
  const pathname = usePathname();
  const role = useMemo(() => pathname.substring(1).split('/')[0], [pathname])

  const signout = destroySession.bind(null, role as Roles)
  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])

  return (
    <aside className={clsx(
      "float-left min-w-[220px] max-w-[220px] bg-[#004aad] shadow flex-shrink text-white",
      isSidebarOpen ? "relative" : "fixed -top-0 -left-[200%]",
    )}>
      <div className="overflow-y-auto overflow-x-hidden max-h-screen py-2 px-6">
        <div className="w-full h-full flex flex-col items-start justify-start">
          <div className="w-full flex-shrink">
            <Image src={smccLogo} alt="SMCC Logo" width={60} height={60} className="mx-auto mt-4" />
            <h1 className="text-center mt-1 mb-2 font-[700] text-[22px]">OCS</h1>
            <div className="font-bold text-center text-blue-900 drop-shadow-lg rounded-lg mb-8 uppercase bg-sky-300 py-1">
              {sessionStatus === "loading" ? <>Loading...</> : (
                <>
                  {role === Roles.Admin && !!user?.highestPosition && <>{user.highestPosition}</>}
                  {role === Roles.Admin && !user?.highestPosition && <>{'Dean/Head'}</>}
                  {role === Roles.SuperAdmin && <>{'Admin'}</>}
                  {role === Roles.Faculty && <>{'Faculty/Staff'}</>}
                </>
              )}
            </div>
          </div>
          {/* <!-- Side Navigation Bars --> */}
          <div className="w-full flex flex-col justify-start items-center space-y-3 font-[600] flex-grow">
            <div role="status" className="animate-pulse h-full flex-col justify-start items-center space-y-6">
              {sessionStatus === "loading" && Array.from({length: 7}, (_, i) => <div key={`skeleton_sidebar_${i}`} className={clsx("w-[155px] rounded-full h-8 bg-sky-400", i === 5 ? "opacity-0" : "")} />)}
            </div>
            { sessionStatus === "authenticated" && sidebarNavigations.map((sn, i: number) => (
              <Link key={i} href={sn.url || '#'} className={clsx(
                "w-full rounded-full text-left hover:border hover:border-yellow-500 pl-3 pr-1 py-1",
                sn.url === `/${role}` && pathname.split("?")[0] === sn.url || sn.url !== `/${role}` && pathname.split("?")[0].startsWith(sn.url as any) ? "border border-black bg-sky-400 text-black" : "",
              )}>
                {sn.name}
              </Link>
            ))}
          </div>
          <div className="w-full flex flex-col justify-start items-center gap-y-4 font-[600] flex-shrink py-8">
            <button type="button" title="Logout" onClick={onLogout} className="w-full rounded-full text-left hover:border hover:border-yellow-500 pl-4 py-1">
              <div className="flex flex-nowrap gap-x-2 items-center">{sessionStatus === "authenticated" && <><LogOutIcon /><span>Logout</span></>}</div>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}