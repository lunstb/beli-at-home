import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { FriendCard } from '../components/friends/FriendCard';
import { FriendRequestCard } from '../components/friends/FriendRequestCard';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
} from '../api/friends';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import type { Friend, FriendRequest, SearchUser } from '../types';

export function FriendsPage() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([getFriends(), getFriendRequests()])
      .then(([f, r]) => {
        setFriends(f);
        setRequests(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results.filter((u) => u.id !== me?.id));
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, me]);

  const handleRequestHandled = () => {
    getFriendRequests().then(setRequests).catch(() => {});
    getFriends().then(setFriends).catch(() => {});
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      setSentRequests((prev) => new Set(prev).add(userId));
      toast('Friend request sent!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send request', 'error');
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
          <h1 className="text-xl font-bold text-stone-800">Friends</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
          />
        </div>

        {/* Search results */}
        {searchQuery.trim() && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wide">
              Search Results
            </h2>
            {searching ? (
              <LoadingSpinner size="sm" />
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">
                No users found
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((u) => {
                  const isFriend = friends.some(
                    (f) => f.id === u.id
                  );
                  const isPending = sentRequests.has(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-warm-border)]"
                    >
                      <div
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="w-11 h-11 rounded-full bg-stone-200 overflow-hidden shrink-0 cursor-pointer"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                            {(u.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/users/${u.id}`)}
                      >
                        <p className="font-semibold text-stone-800 text-sm truncate">
                          {u.username}
                        </p>
                        <p className="text-xs text-stone-400 truncate">@{u.username}</p>
                      </div>
                      {isFriend ? (
                        <span className="text-xs text-green-500 font-medium px-3 py-1.5 bg-green-50 rounded-lg">
                          Friends
                        </span>
                      ) : isPending ? (
                        <span className="text-xs text-stone-400 font-medium px-3 py-1.5 bg-stone-50 rounded-lg">
                          Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u.id)}
                          className="text-xs text-[var(--color-primary)] font-medium px-3 py-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pending requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wide">
              Pending Requests ({requests.length})
            </h2>
            <div className="space-y-2">
              {requests.map((req) => (
                <FriendRequestCard
                  key={req.id}
                  request={req}
                  onHandled={handleRequestHandled}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current friends */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wide">
            Your Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <EmptyState
              icon={<Users size={48} />}
              heading="No friends yet"
              subtext="Search for friends by username above to get started!"
            />
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
