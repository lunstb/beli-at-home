import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Friend } from '../../types';

interface FriendCardProps {
  friend: Friend;
}

export function FriendCard({ friend }: FriendCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/users/${friend.id}`)}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-warm-border)] hover:shadow-sm transition-all"
    >
      <div className="w-11 h-11 rounded-full bg-stone-200 overflow-hidden shrink-0">
        {friend.avatar_url ? (
          <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
            {(friend.username || '?')[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="font-semibold text-stone-800 text-sm truncate">
          {friend.username}
        </p>
        <p className="text-xs text-stone-400 truncate">@{friend.username}</p>
      </div>
      <ChevronRight size={18} className="text-stone-300 shrink-0" />
    </button>
  );
}
