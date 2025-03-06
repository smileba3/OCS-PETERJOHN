'use client';;
import CardContainer from "@/app/(offices)/_components/card-container";
import LoadingComponent from "@/components/loading";
import { NotificationDocument } from "@/lib/modelInterfaces";
import { useSession } from "@/lib/useSession";
import clsx from "clsx";
import { Button, Pagination, Spinner } from "evergreen-ui";
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from "react";

export default function NotificationsPage() {

  const { data: session, status, notifications, markAsAllRead, markAsRead } = useSession({
    redirect: true,
  });

  const authenticated = useMemo(() => status === 'authenticated', [status])

  const [allNotifications, setAllNotifications] = useState<NotificationDocument[]>([]);
  const [page, setPage] = useState(1);
  const totalPages = useMemo(() => authenticated ? Math.ceil(allNotifications.length / 10) : 0, [allNotifications, authenticated]);
  const currentPageNotifications = useMemo(() => totalPages > 0 ? allNotifications.slice((page - 1) * 10, page * 10) : [], [totalPages, page, allNotifications]);
  const hasNotifications = useMemo(() => authenticated && allNotifications.length > 0, [authenticated, allNotifications]);
  const [eventSource, setEventSource] = useState<EventSource|undefined>();
  const [isLoading, setLoading] = useState(true);

  const onMessage = useCallback((ev: MessageEvent) => {
    setLoading(true)
    const notifs = JSON.parse(ev.data)
    setAllNotifications(notifs)
    setLoading(false)
  }, [])

  const onNotifError = useCallback((ev: Event) => {
    if (!!eventSource?.OPEN) {
      eventSource.close()
    }
  }, [eventSource])

  const refreshNotif = useCallback(() => {
    if (!!eventSource?.OPEN) {
      eventSource.close()
    }
    const url = new URL('/' + session!.user.role + '/api/stream/notification', window.location.origin)
    const newEventSource = new EventSource(url, { withCredentials: true });
    setEventSource(newEventSource)

    newEventSource.onmessage = onMessage;

    newEventSource.onerror = onNotifError;

    return newEventSource
  }, [eventSource, onMessage, onNotifError, session])

  useEffect(() => {
    if (authenticated) {
      setLoading(true)
      const newEventSource = refreshNotif()

      return () => {
        if (!!newEventSource?.OPEN) {
          newEventSource.close();
        }
      };
    }
    return () => {
      if (!!eventSource?.OPEN) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line
  }, [authenticated]);

  if (status === 'loading') {
    return <div className="h-full w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <div className="p-6">
        <CardContainer title={
            <div className="flex justify-between items-center">
              <span>All Notifications</span>
              <span className="text-sm font-normal">
                ({notifications.length} unread)
                <Button
                  onClick={() => {
                    markAsAllRead()
                    refreshNotif()
                  }}
                  disabled={notifications.length === 0}
                  appearance="primary"
                  intent="primary"
                  marginLeft={8}
                >
                  Mark all as read
                </Button>
              </span>
            </div>
          }
        >
          <ul>
            {currentPageNotifications.map((notification) => (
                <li key={notification._id} className="mb-3">
                  <NextLink
                    href={notification.href}
                    onClick={() => {
                      markAsRead(notification._id as string)
                      eventSource?.close()
                    }}
                    className={clsx(
                      "relative flex flex-col justify-start items-start px-2 mb-0.5 pt-2 pb-6 min-h-[80px] rounded shadow shadow-blue-500",
                      notification.read
                      ? "text-slate-500"
                      : "bg-sky-50 text-blue-600"
                    )}
                  >
                      <div className="font-bold text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-500">{notification.message}</div>
                      <span className="absolute left-2 bottom-1 text-xs text-slate-800">{new Date(notification.date as string|Date).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour12: true, hour: 'numeric', minute: 'numeric' })}</span>
                  </NextLink>
                </li>
              )
            )}
          </ul>
          { hasNotifications ? (
            <div className="w-full flex justify-center">
              <Pagination page={page} onPageChange={setPage} totalPages={totalPages} />
            </div>
          ) : (
            isLoading ? (
              <div className="w-full flex justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="w-full text-center">
                {/* // message here */}
                <div className="text-slate-500 text-sm">
                  There is nothing here
                </div>
              </div>
              )
            )
          }
        </CardContainer>
      </div>
    </>
  )
}