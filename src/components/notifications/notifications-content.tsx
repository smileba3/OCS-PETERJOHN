'use client';
import { Roles, type NotificationDocument } from "@/lib/modelInterfaces";
import { Button, Menu, NotificationsUpdatedIcon, Tooltip } from "evergreen-ui";
import NextLink from 'next/link';
import { Fragment, useMemo } from "react";

export default function NotificationsContent({ notifications = [], role = Roles.Faculty, onMarkAsRead = (notifId: string) => {}, onMarkAllRead = () => {} }: { onMarkAsRead?: (innotifIddex: string) => void; onMarkAllRead?: () => void; notifications?: NotificationDocument[]; role?: Roles }) {

  const notificationsCount = useMemo(() => notifications.length, [notifications]);

  return (
    <Menu>
      <Menu.Group>
        <div className="text-slate-500 text-sm w-full px-4 flex justify-between items-center">
          <Tooltip content="Click to view all notifications">
            <NextLink href={'/' + role + '/notifications'}>Notifications</NextLink>
          </Tooltip>
          <p className="italic text-xs">({notificationsCount})</p>
        </div>
      </Menu.Group>
      <Menu.Divider />
      { notifications.length > 0 && (<>
        <Menu.Group>
          <div className="flex flex-col w-full max-h-80 overflow-y-auto">
            {notifications.map((notification, index) => (
              <Fragment key={notification._id || `${notificationsCount - index - 1}`}>
                <NextLink
                  onClick={() => onMarkAsRead(notification._id as string)}
                  href={notification.href}
                  className="relative flex flex-col justify-start items-start max-w-[400px] px-2 mx-2 mb-0.5 py-2 min-h-[80px] rounded bg-orange-100 text-green-600"
                >
                    <div className="font-bold text-sm">{notification.title.substring(0, 50)}{notification.title.length > 50 ? '...' : ''}</div>
                    <div className="text-xs text-gray-500">{notification.message.substring(0, 70)} ...</div>
                    <span className="absolute left-2 bottom-1 text-xs text-slate-800">{new Date(notification.date as string|Date).toLocaleString()}</span>
                </NextLink>
              </Fragment>))}
          </div>
        </Menu.Group>
        <Menu.Divider />
      </>)}
      <Menu.Group>
        { notifications.length > 0 ? (
          <div className="text-slate-500 text-sm w-full px-4 flex justify-end items-center">
            <Button onClick={onMarkAllRead} iconBefore={NotificationsUpdatedIcon} size={"small"} appearance="primary" fontSize="smaller">Mark all as read</Button>
          </div>
          ) : (
            <div className="text-slate-500 text-center text-sm w-full px-4">
              No notifications
            </div>
          )
        }
      </Menu.Group>
    </Menu>
  )
}