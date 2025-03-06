'use client';
import { Roles, type NotificationDocument } from "@/lib/modelInterfaces";
import { DotIcon, Icon, NotificationsIcon, Popover, Position } from "evergreen-ui";
import NotificationsContent from "./notifications-content";

export default function NotificationsNav({ notifications = [], iconColor = "orange25", isShown, onOpenComplete, role = Roles.Faculty, onMarkAsRead = (notifId: string) => {}, onMarkAllRead = () => {}, ...props }: { onMarkAsRead?: (notifId: string) => void; onMarkAllRead?: () => void, role?: Roles, isShown?: boolean, onOpenComplete?: () => void, notifications?: NotificationDocument[], iconColor?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (<div {...props}>
      <Popover
        isShown={isShown}
        onOpenComplete={onOpenComplete}
        position={Position.BOTTOM_RIGHT}
        content={<NotificationsContent onMarkAsRead={onMarkAsRead} onMarkAllRead={onMarkAllRead} notifications={notifications} role={role} />}
      >
        <button
          className="relative aspect-ratio-1 h-[50px] mt-2"
        >
          <Icon icon={NotificationsIcon} color={iconColor} size={20} className="shadow" />
          {notifications.length > 0 && <Icon icon={DotIcon} position="absolute" left="0" top="3px" marginLeft="3px" color="danger" size={27} />}
        </button>
      </Popover>
    </div>
  )
}