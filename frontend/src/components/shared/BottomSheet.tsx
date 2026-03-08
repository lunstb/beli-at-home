import { useEffect, useState } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? 'opacity-40' : 'opacity-0'
        }`}
      />
      {/* Sheet - bottom on mobile, centered on desktop */}
      <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 pb-8 sm:pb-6 transition-transform duration-300 ease-out ${
            animating ? 'translate-y-0 sm:translate-y-0' : 'translate-y-full sm:translate-y-4'
          }`}
        >
          {/* Drag handle (mobile only) */}
          <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
