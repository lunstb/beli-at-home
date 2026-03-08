export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-stone-200 rounded-xl animate-pulse ${className}`} />
  );
}

export function DishCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[var(--color-warm-border)]">
      <div className="aspect-square bg-stone-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-stone-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-stone-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function DishDetailSkeleton() {
  return (
    <div>
      <div className="aspect-[4/3] bg-stone-200 animate-pulse md:rounded-2xl -mx-4 md:mx-0" />
      <div className="pt-10 pb-6 space-y-4">
        <div className="h-7 bg-stone-200 rounded-lg animate-pulse w-2/3" />
        <div className="h-4 bg-stone-100 rounded animate-pulse w-1/2" />
        <div className="flex gap-2">
          <div className="h-7 bg-stone-100 rounded-full animate-pulse w-16" />
          <div className="h-7 bg-stone-100 rounded-full animate-pulse w-20" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 bg-stone-200 rounded-xl animate-pulse flex-1" />
          <div className="h-12 bg-stone-200 rounded-xl animate-pulse w-12" />
          <div className="h-12 bg-stone-200 rounded-xl animate-pulse w-12" />
        </div>
      </div>
    </div>
  );
}

export function DishGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DishCardSkeleton key={i} />
      ))}
    </div>
  );
}
