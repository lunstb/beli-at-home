import { useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFriendRequests } from '../../api/friends';

export function Header() {
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    getFriendRequests()
      .then((requests) => setRequestCount(requests.length))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-warm-bg)]/80 backdrop-blur-md border-b border-[var(--color-warm-border)]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-stone-800 cursor-pointer"
          onClick={() => navigate('/')}
        >
          Beli <span className="text-[var(--color-primary)]">at Home</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/friends')}
            className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <Bell size={20} className="text-stone-600" />
            {requestCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {requestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <Settings size={20} className="text-stone-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
