import { UtensilsCrossed } from 'lucide-react';
import type { Dish } from '../../types';

interface ComparisonCardProps {
  dish: Dish;
  selected: boolean;
  onSelect: () => void;
}

export function ComparisonCard({ dish, selected, onSelect }: ComparisonCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl overflow-hidden transition-all duration-300 border-3 ${
        selected
          ? 'border-[var(--color-primary)] shadow-lg shadow-orange-200 scale-[1.03]'
          : 'border-transparent shadow-sm hover:shadow-md hover:scale-[1.01]'
      } bg-white`}
    >
      <div className="aspect-square overflow-hidden bg-stone-100">
        {dish.photo_path ? (
          <img
            src={dish.photo_path}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <UtensilsCrossed size={48} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-stone-800 text-sm truncate">{dish.name}</h3>
      </div>
    </button>
  );
}
