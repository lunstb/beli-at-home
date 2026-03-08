import { useNavigate, useLocation } from 'react-router-dom';
import { Utensils, PlusCircle, ChefHat, Users, Bookmark } from 'lucide-react';

const navItems = [
  { path: '/', icon: Utensils, label: 'Home' },
  { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { path: '/dishes/new', icon: PlusCircle, label: 'Add' },
  { path: '/friends', icon: Users, label: 'Friends' },
  { path: '/profile', icon: ChefHat, label: 'Kitchen' },
];

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[var(--color-warm-border)] md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-[var(--color-warm-border)] flex-col items-center pt-6 gap-2 z-50">
        <div className="text-[var(--color-primary)] font-bold text-lg mb-6">B</div>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors w-16 ${
                isActive
                  ? 'text-[var(--color-primary)] bg-orange-50'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
