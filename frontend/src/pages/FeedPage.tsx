import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rss, Star, Compass, UtensilsCrossed, Search } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ActivityCard } from '../components/feed/ActivityCard';
import { DiscoverCard } from '../components/feed/DiscoverCard';
import { DishCard } from '../components/dish/DishCard';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { getFeed, getDiscoverFeed } from '../api/feed';
import { getDishes } from '../api/dishes';
import type { ActivityItem, Dish } from '../types';

type Tab = 'friends' | 'mytop' | 'discover';

const tabs: { key: Tab; label: string; icon: typeof Rss }[] = [
  { key: 'friends', label: 'Friends', icon: Rss },
  { key: 'mytop', label: 'My Top', icon: Star },
  { key: 'discover', label: 'Discover', icon: Compass },
];

export function FeedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [feedItems, setFeedItems] = useState<ActivityItem[]>([]);
  const [myDishes, setMyDishes] = useState<Dish[]>([]);
  const [discoverDishes, setDiscoverDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'friends') {
      getFeed({ limit: 30 })
        .then(setFeedItems)
        .catch(() => setFeedItems([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'mytop') {
      getDishes({ sort: 'rating', limit: 50 })
        .then(setMyDishes)
        .catch(() => setMyDishes([]))
        .finally(() => setLoading(false));
    } else {
      getDiscoverFeed({ limit: 30 })
        .then(setDiscoverDishes)
        .catch(() => setDiscoverDishes([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const filteredDishes = search
    ? myDishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : myDishes;

  return (
    <PageContainer>
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-5 mt-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Friends Feed */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {feedItems.length === 0 ? (
                <EmptyState
                  icon={<Rss size={48} />}
                  heading="No activity yet"
                  subtext="Add some friends to see what they're cooking!"
                  action={
                    <button
                      onClick={() => navigate('/friends')}
                      className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      Find Friends
                    </button>
                  }
                />
              ) : (
                feedItems.map((item) => (
                  <ActivityCard key={item.id} item={item} />
                ))
              )}
            </div>
          )}

          {/* My Top */}
          {activeTab === 'mytop' && (
            <div>
              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your meals..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
                />
              </div>
              {filteredDishes.length === 0 ? (
                <EmptyState
                  icon={<UtensilsCrossed size={48} />}
                  heading="No meals yet"
                  subtext="Add your first meal and start ranking!"
                  action={
                    <button
                      onClick={() => navigate('/dishes/new')}
                      className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      Add a Meal
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredDishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discover */}
          {activeTab === 'discover' && (
            <div>
              {discoverDishes.length === 0 ? (
                <EmptyState
                  icon={<Compass size={48} />}
                  heading="Nothing to discover"
                  subtext="Add friends to discover their highest-rated meals!"
                  action={
                    <button
                      onClick={() => navigate('/friends')}
                      className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      Find Friends
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {discoverDishes.map((dish) => (
                    <DiscoverCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
