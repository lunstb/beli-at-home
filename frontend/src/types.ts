export interface User {
  id: number;
  google_id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  dish_count?: number;
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
  // Joined fields from feed/discover queries
  username?: string;
  avatar_url?: string;
  owner_avatar?: string;
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

export interface DishPhoto {
  id: number;
  dish_id: number;
  photo_path: string;
  caption: string | null;
  sort_order: number;
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

export interface Friend {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  friendship_id: number;
  friends_since: string;
}

export interface FriendRequest {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: 'pending';
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string | null;
}

export interface ActivityItem {
  id: number;
  user_id: number;
  type: 'new_dish' | 'ranked_dish' | 'tried_friend_dish';
  dish_id: number;
  metadata: string | null;
  created_at: string;
  // Joined fields
  username: string;
  avatar_url: string | null;
  dish_name: string | null;
  dish_photo: string | null;
  dish_rating: number | null;
}

export interface Matchup {
  anchorDish: Dish;
  opponentDish: Dish;
}

export interface RankingSession {
  sessionId: string;
  matchup: Matchup;
  totalRounds: number;
  currentRound: number;
}

export interface RankingCompareResult {
  nextMatchup: Matchup | null;
  currentRound: number;
  totalRounds: number;
}

export interface RankingResult {
  anchorDish: Dish;
  newRating: number | null;
  rankPosition: number;
  totalDishes: number;
  delta: number | null;
}

export interface Bookmark {
  id: number;
  user_id: number;
  dish_id: number;
  created_at: string;
  // Joined fields
  dish_name: string;
  dish_photo: string | null;
  dish_rating: number | null;
  owner_username: string;
  owner_avatar: string | null;
}

export interface SearchUser {
  id: number;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}
