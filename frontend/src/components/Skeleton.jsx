export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function ResultSkeleton() {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}
