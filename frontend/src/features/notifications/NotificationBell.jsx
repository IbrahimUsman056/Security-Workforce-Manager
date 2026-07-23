import { useState } from 'react';
import { useGetNotificationsQuery, useMarkAsReadMutation } from './notificationsApi';
import { formatDateTime } from '../../utils/dateHelpers';

export default function NotificationBell() {
  const { data: notifications } = useGetNotificationsQuery(undefined, { pollingInterval: 30000 });
  const [markAsRead] = useMarkAsReadMutation();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="notif-wrapper">
      <button onClick={() => setOpen(!open)} className="notif-bell">
        🔔 {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          {notifications?.length ? notifications.map((n) => (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => !n.is_read && markAsRead(n.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{n.title}</strong>
                <span style={{ fontSize: '11px', color: '#888' }}>{formatDateTime(n.created_at)}</span>
              </div>
              <p>{n.message}</p>
            </div>
          )) : <p className="notif-empty">No notifications</p>}
        </div>
      )}
    </div>
  );
}