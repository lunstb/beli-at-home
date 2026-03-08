import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Clock, Search } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DishCard } from '../components/dish/DishCard';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { getUser, getFriends, sendFriendRequest, removeFriend } from '../api/friends';
import { getUserDishes } from '../api/dishes';
import { formatScore } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import type { User, Dish, Friend } from '../types';
import { UtensilsCrossed } from 'lucide-react';

type FriendStatus = 'none' | 'pending' | 'friends';

export function UserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const userId = Number(id);

    // If viewing own profile, redirect
    if (me && me.id === userId) {
      navigate('/profile', { replace: true });
      return;
    }

    Promise.all([
      getUser(userId),
      getUserDishes(userId, { sort }),
      getFriends(),
    ])
      .then(([u, d, friends]) => {
        setProfileUser(u);
        setDishes(d);
        const friendship = friends.find(
          (f) => f.id === userId
        );
        if (friendship) {
          setFriendStatus('friends');
          setFriendshipId(friendship.friendship_id);
        }
        // Note: pending status would need to be checked differently
        // since getFriends only returns accepted friends
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, me, navigate, sort]);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    dishes.forEach((d) => {
      d.tags?.forEach((t) => {
        tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [dishes]);

  const avgRating = useMemo(() => {
    const rated = dishes.filter((d) => d.rating !== null);
    if (rated.length === 0) return null;
    return rated.reduce((sum, d) => sum + d.rating!, 0) / rated.length;
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    let result = dishes;
    if (filterTag) {
      result = result.filter((d) => d.tags?.some((t) => t.tag === filterTag));
    }
    if (search) {
      result = result.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [dishes, filterTag, search]);

  const handleFriendAction = async () => {
    if (!profileUser) return;
    setActionLoading(true);
    try {
      if (friendStatus === 'none') {
        await sendFriendRequest(profileUser.id);
        setFriendStatus('pending');
        toast('Friend request sent!', 'success');
      } else if (friendStatus === 'friends' && friendshipId) {
        await removeFriend(friendshipId);
        setFriendStatus('none');
        setFriendshipId(null);
        toast('Friend removed', 'info');
      }
    } catch (err: any) {
      toast(err.message || 'Action failed', 'error');
    }
    setActionLoading(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!profileUser) return null;

  return (
    <PageContainer>
      <div className="py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors mb-2"
        >
          <ArrowLeft size={20} className="text-stone-600" />
        </button>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-stone-200 overflow-hidden shrink-0">
            {profileUser.avatar_url ? (
              <img src={profileUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xl font-bold">
                {(profileUser.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-stone-800 truncate">
              {profileUser.username}
            </h1>
            {profileUser.bio && (
              <p className="text-sm text-stone-500 line-clamp-2">{profileUser.bio}</p>
            )}
          </div>
        </div>

        {/* Friend status button */}
        <button
          onClick={handleFriendAction}
          disabled={actionLoading || friendStatus === 'pending'}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm mb-6 transition-colors ${
            friendStatus === 'friends'
              ? 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500'
              : friendStatus === 'pending'
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
          } disabled:opacity-70`}
        >
          {friendStatus === 'friends' && (
            <>
              <UserCheck size={18} />
              Friends
            </>
          )}
          {friendStatus === 'pending' && (
            <>
              <Clock size={18} />
              Request Pending
            </>
          )}
          {friendStatus === 'none' && (
            <>
              <UserPlus size={18} />
              Add Friend
            </>
          )}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] text-center">
            <p className="text-2xl font-bold text-stone-800">{dishes.length}</p>
            <p className="text-xs text-stone-400">meals</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] text-center">
            <p className="text-2xl font-bold text-stone-800">{formatScore(avgRating)}</p>
            <p className="text-xs text-stone-400">avg rating</p>
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none bg-white text-stone-700"
          >
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterTag === null
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {allTags.map(([name]) => (
              <button
                key={name}
                onClick={() => setFilterTag(filterTag === name ? null : name)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterTag === name
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Dishes */}
        {filteredDishes.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed size={48} />}
            heading="No meals to show"
            subtext="This kitchen is empty or matches no filters."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
