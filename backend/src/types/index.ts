export interface User {
  id: number;
  google_id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: number;
  user_id: number;
  name: string;
  caption: string | null;
  photo_path: string | null;
  elo_score: number;
  rating: number | null;
  ranking_count: number;
  tier: 'bad' | 'ok' | 'great' | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags?: DishTag[];
  recipe_info?: RecipeInfo[];
  photos?: DishPhoto[];
}

export interface DishPhoto {
  id: number;
  dish_id: number;
  photo_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface DishTag {
  id: number;
  dish_id: number;
  tag: string;
}

export interface RecipeInfo {
  id: number;
  dish_id: number;
  type: 'link' | 'text' | 'image';
  content: string;
  sort_order: number;
  created_at: string;
}

export interface Comparison {
  id: number;
  user_id: number;
  winner_dish_id: number;
  loser_dish_id: number;
  session_id: string;
  created_at: string;
}

export interface Friendship {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface ActivityFeedItem {
  id: number;
  user_id: number;
  type: 'new_dish' | 'ranked_dish' | 'tried_friend_dish';
  dish_id: number;
  metadata: string | null;
  created_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  dish_id: number;
  created_at: string;
}
