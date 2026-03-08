import { useNavigate } from 'react-router-dom';
import { ScoreBadge } from '../shared/ScoreBadge';
import type { Dish } from '../../types';
import { Images, UtensilsCrossed } from 'lucide-react';

interface DishCardProps {
  dish: Dish;
  showOwner?: boolean;
}

export function DishCard({ dish, showOwner }: DishCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/dishes/${dish.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border border-[var(--color-warm-border)]"
    >
      <div className="aspect-square overflow-hidden bg-stone-100 relative">
        {dish.photo_path ? (
          <img
            src={dish.photo_path}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <UtensilsCrossed size={40} />
          </div>
        )}
        {dish.photos && dish.photos.length > 1 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded-md text-white text-[10px] font-medium">
            <Images size={10} />
            {dish.photos.length}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <ScoreBadge rating={dish.rating} size="sm" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-stone-800 text-sm truncate">{dish.name}</h3>
        {showOwner && dish.username && (
          <p className="text-xs text-stone-400 mt-0.5 truncate">
            by {dish.username}
          </p>
        )}
      </div>
    </div>
  );
}
