import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Tag, UtensilsCrossed, Bell } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { getNotifications, markAllRead } from '../api/notifications';
import type { Notification } from '../types';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'friend_request': return <UserPlus size={16} className="text-blue-500" />;
    case 'friend_accepted': return <UserCheck size={16} className="text-green-500" />;
    case 'tagged_in_dish': return <Tag size={16} className="text-[var(--color-primary)]" />;
    case 'friend_new_dish': return <UtensilsCrossed size={16} className="text-purple-500" />;
  }
}

function getNotificationText(n: Notification): string {
  switch (n.type) {
    case 'friend_request': return 'wants to be your friend';
    case 'friend_accepted': return 'accepted your friend request';
    case 'tagged_in_dish': return `tagged you in ${n.dish_name || 'a meal'}`;
    case 'friend_new_dish': return `added a new meal: ${n.dish_name || ''}`;
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((n) => {
        setNotifications(n);
        markAllRead();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNotificationClick = (n: Notification) => {
    if (n.type === 'friend_request') {
      navigate('/friends');
    } else if (n.type === 'friend_accepted') {
      navigate(`/users/${n.from_user_id}`);
    } else if (n.dish_id) {
      navigate(`/dishes/${n.dish_id}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer>
      <div className="py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-xl font-bold text-stone-800">Notifications</h1>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} />}
            heading="No notifications yet"
            subtext="You'll see friend requests, tags, and activity here"
          />
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                  n.read ? 'bg-white' : 'bg-orange-50'
                } hover:bg-stone-50`}
              >
                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden shrink-0">
                  {n.from_avatar_url ? (
                    <img src={n.from_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-sm">
                      {(n.from_username || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800">
                    <span className="font-semibold">{n.from_username}</span>{' '}
                    {getNotificationText(n)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getNotificationIcon(n.type)}
                    <span className="text-xs text-stone-400">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                {n.dish_photo && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                    <img src={n.dish_photo} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
