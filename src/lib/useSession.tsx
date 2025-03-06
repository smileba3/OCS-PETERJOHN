'use client';
import { updateReadAllNotification, updateReadNotification } from "@/actions/notifications";
import { NotificationDocument, Roles } from "@/lib/modelInterfaces";
import { toaster } from "evergreen-ui";
import { type JWTPayload } from "jose";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { destroySession, updateSession } from "./session";
import type { AuthenticationStatus, SessionPayload } from "./types";

export const SessionContext = createContext<{
  error: Error | undefined;
  data: SessionPayload | null;
  status: AuthenticationStatus;
  refresh: (redirect?: boolean) => void | Promise<void>;
  update: () => void | Promise<void>;
  notifications: NotificationDocument[];
  refreshNotification: () => void;
  markAsRead: (notifId: string) => Promise<void>;
  markAsAllRead: () => void;
}>({
  error: undefined,
  data: null,
  status: 'loading',
  refresh: () => {},
  update: () => {},
  notifications: [],
  refreshNotification: () => {},
  markAsRead: async (notifId: string) => {},
  markAsAllRead: () => {},
})

export function SessionProvider({ children }: Readonly<{ children: React.ReactNode; }>) {

  const [data, setData] = useState<SessionPayload | null>()
  const [status, setStatus] = useState<AuthenticationStatus>('loading')
  const [error, setError] = useState<Error | undefined>()
  const [notifications, setNotifications] = useState<NotificationDocument[]>([])
  const [eventSource, setEventSource] = useState<EventSource|undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const pathname = usePathname()

  const role = useMemo(() => [Roles.Admin, Roles.Faculty, Roles.SuperAdmin].includes(pathname.substring(1).split('/')?.[0] as any) ? pathname.substring(1).split('/')[0] : undefined, [pathname])

  const authenticated = useMemo(() => status === 'authenticated', [status])

  const onMessage = useCallback((ev: MessageEvent) => {
    const notifs = JSON.parse(ev.data)
    setNotifications(notifs)
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
    const url = new URL('/' + role + '/api/stream/notification', window.location.origin)
    url.searchParams.append('unread', '1')
    const newEventSource = new EventSource(url, { withCredentials: true });
    setEventSource(newEventSource)

    newEventSource.onmessage = onMessage;

    newEventSource.onerror = onNotifError;

    return newEventSource
  }, [eventSource, role, onMessage, onNotifError])

  const markAsAllRead = useCallback(async () => {
    // do some all read here
    if (authenticated && !!data && data!.user.role === role) {
      try {
        const upAllNotif = updateReadAllNotification.bind(null, role)
        const res = await upAllNotif()
        if (!res.success) {
          console.log(res.error)
          toaster.danger("Something went wrong")
        }
        setRefreshTrigger(prev => prev + 1)
      } catch (e) {}
    }
  }, [authenticated, data, role])

  const markAsRead = useCallback(async (notifId: string) => {
    // do some read here
    if (authenticated && !!data && data!.user.role === role) {
      try {
        const upNotif = updateReadNotification.bind(null, role, notifId)
        const res = await upNotif()
        if (!res.success) {
          console.log(res.error)
          toaster.danger("Something went wrong")
        }
        setRefreshTrigger(prev => prev + 1)
      } catch (e) {}
    }
  }, [authenticated, data, role])

  useEffect(() => {
    if (authenticated) {
      const newEventSource = refreshNotif()

      return () => {
        // if (!!newEventSource?.OPEN) {
        //   newEventSource.close();
        // }
      };

    }
    return () => {
      if (!!eventSource?.OPEN) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line
  }, [authenticated, refreshTrigger]);

  const refresh = useCallback((role: Roles, redirect: boolean) => {
    if ([Roles.Admin, Roles.Faculty, Roles.SuperAdmin].includes(role)) {
      const url = new URL('/' + role + '/api/session', window.location.origin);

      fetch(url)
        .then((response) => response.json())
        .then(async ({ data: session }: { data: JWTPayload | SessionPayload | { [key: string]: any;} | null;}) => {
          if (!session || (new Date(session!.expiresAt as Date|string).getTime()) < (new Date()).getTime()) {
            const signOut = destroySession.bind(null, role)
            await signOut()
            setData(null)
            setStatus('unauthenticated')
            if (redirect) {
              window.location.href = window.location.origin + '/' + role + '/login';
            }
          } else {
            setData(session as SessionPayload|null)
            setStatus('authenticated')
          }
        })
        .catch((error: any) => {
          setData(null)
          setError(error)
          setStatus('error')
          if (redirect) {
            window.location.replace(window.location.origin + '/' + role + '/login')
          }
        })
    }
  }, []);

  const update = useCallback(() => {
    updateSession(role as any).catch(console.log)
  }, [role])


  useEffect(() => {
    refresh(role as any, false)
    // eslint-disable-next-line
  }, [pathname])

  return <SessionContext.Provider value={{
    notifications,
    refreshNotification: () => setRefreshTrigger(prev => prev + 1),
    markAsRead,
    markAsAllRead,
    error,
    data,
    status,
    refresh: (redirect: boolean = true) => refresh(role as any, redirect),
    update
  }}>
    {children}
  </SessionContext.Provider>
}

export function useSession({ redirect = true } : Readonly<{ redirect?: boolean; }>) {
  const context = useContext(SessionContext)
  const { error, data, status, refresh, notifications, refreshNotification, markAsRead, markAsAllRead, update } = context
  const refreshSession = refresh.bind(null, redirect)

  const pathname = usePathname();

  const role = useMemo(() => status === 'authenticated' ? data?.user.role : undefined, [status, data])
  // const isPhoneVerified = useMemo(() => status === 'authenticated'? data?.user.isPhoneVerified : undefined, [status, data])
  // const isEmailVerified = useMemo(() => status === 'authenticated'? data?.user.isEmailVerified : undefined, [status, data])

  useEffect(() => {
    if (redirect) {
      refreshSession()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (redirect
      && status === 'authenticated'
      && pathname !== '/' + role + '/login'
      && pathname !== '/' + role + '/phoneverify'
      && pathname !== '/' + role + '/verify'
      && pathname !== '/' + role + '/signup/verify/email'
      && pathname !== '/' + role + '/notifications'
      && !pathname.startsWith('/' + role + '/settings')
    ) {
      refreshSession()
      // if (!isPhoneVerified && !isEmailVerified) {
        // redirectRoute('/' + data?.user.role + '/phoneverify')
        // redirectRoute('/' + data?.user.role + '/verify')
      // }
    }
    // eslint-disable-next-line
  }, [status, role])

  return {
    notifications,
    refreshNotification,
    markAsRead,
    markAsAllRead,
    error,
    data,
    status,
    refresh: refreshSession,
    update
  }
}