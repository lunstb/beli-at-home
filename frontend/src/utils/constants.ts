export const TAG_SUGGESTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Thai',
  'Japanese', 'Chinese', 'Korean', 'Mediterranean', 'American',
  'French', 'Vietnamese', 'Greek', 'Middle Eastern', 'Caribbean',
  'Pasta', 'Pizza', 'Soup', 'Salad', 'Sandwich',
  'Stir Fry', 'Curry', 'Tacos', 'Burger', 'Steak',
  'Seafood', 'Chicken', 'Beef', 'Pork', 'Vegetarian',
  'Vegan', 'Dessert', 'Baking', 'Breakfast', 'Brunch',
  'Comfort Food', 'Healthy', 'Quick', 'Slow Cook', 'Grilled',
  'Spicy', 'Sweet', 'Savory', 'Holiday', 'Family Recipe',
];

export const SCORE_COLORS = {
  high: { min: 7, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  mid: { min: 4, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  low: { min: 0, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
} as const;

export function getScoreColor(rating: number | null | undefined) {
  if (rating === null || rating === undefined) {
    return { color: 'text-stone-400', bg: 'bg-stone-100', border: 'border-stone-200' };
  }
  if (rating >= SCORE_COLORS.high.min) return SCORE_COLORS.high;
  if (rating >= SCORE_COLORS.mid.min) return SCORE_COLORS.mid;
  return SCORE_COLORS.low;
}
