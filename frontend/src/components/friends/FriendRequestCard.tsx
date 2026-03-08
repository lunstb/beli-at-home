import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { acceptFriendRequest, declineFriendRequest } from '../../api/friends';
import type { FriendRequest } from '../../types';

interface FriendRequestCardProps {
  request: FriendRequest;
  onHandled: () => void;
}

export function FriendRequestCard({ request, onHandled }: FriendRequestCardProps) {
  const { toast } = useToast();
  const [handling, setHandling] = useState(false);

  const handleAccept = async () => {
    setHandling(true);
    try {
      await acceptFriendRequest(request.id);
      toast('Friend request accepted!', 'success');
      onHandled();
    } catch (err: any) {
      toast(err.message || 'Failed to accept request', 'error');
      setHandling(false);
    }
  };

  const handleDecline = async () => {
    setHandling(true);
    try {
      await declineFriendRequest(request.id);
      onHandled();
    } catch (err: any) {
      toast(err.message || 'Failed to decline request', 'error');
      setHandling(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-warm-border)]">
      <div className="w-11 h-11 rounded-full bg-stone-200 overflow-hidden shrink-0">
        {request.avatar_url ? (
          <img src={request.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
            {(request.username || '?')[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800 text-sm truncate">
          {request.username}
        </p>
        <p className="text-xs text-stone-400">wants to be friends</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleAccept}
          disabled={handling}
          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <Check size={18} />
        </button>
        <button
          onClick={handleDecline}
          disabled={handling}
          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
