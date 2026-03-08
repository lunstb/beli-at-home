import { useNavigate } from 'react-router-dom';
import { ScoreBadge } from '../shared/ScoreBadge';
import { formatDate } from '../../utils/formatters';
import { UtensilsCrossed } from 'lucide-react';
import type { ActivityItem } from '../../types';

interface ActivityCardProps {
  item: ActivityItem;
}

function getActivityMessage(type: string): string {
  switch (type) {
    case 'new_dish':
      return 'added a new meal';
    case 'ranked_dish':
      return 'ranked a meal';
    case 'tried_friend_dish':
      return "tried a friend's meal";
    default:
      return 'did something';
  }
}

export function ActivityCard({ item }: ActivityCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-warm-border)] animate-fade-in">
      {/* User row */}
      <div className="flex items-center gap-3 p-3">
        <div
          onClick={() => navigate(`/users/${item.user_id}`)}
          className="w-9 h-9 rounded-full bg-stone-200 overflow-hidden cursor-pointer shrink-0"
        >
          {item.avatar_url ? (
            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm font-bold">
              {(item.username || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800">
            <span className="font-semibold">{item.username}</span>{' '}
            <span className="text-stone-500">{getActivityMessage(item.type)}</span>
          </p>
          <p className="text-xs text-stone-400">{formatDate(item.created_at)}</p>
        </div>
      </div>

      {/* Dish photo */}
      {item.dish_id && item.dish_name && (
        <div
          onClick={() => navigate(`/dishes/${item.dish_id}`)}
          className="cursor-pointer"
        >
          {item.dish_photo ? (
            <img
              src={item.dish_photo}
              alt={item.dish_name}
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-stone-100 flex items-center justify-center text-stone-300">
              <UtensilsCrossed size={48} />
            </div>
          )}
          <div className="flex items-center justify-between p-3">
            <h3 className="font-semibold text-stone-800 text-sm">{item.dish_name}</h3>
            <ScoreBadge rating={item.dish_rating} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
