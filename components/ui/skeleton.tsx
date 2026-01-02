import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// Skeleton específicos para diferentes secciones
function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

function CatalogCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

function DashboardKPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <Skeleton className="h-64 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export {
  Skeleton,
  ProductCardSkeleton,
  CatalogCardSkeleton,
  DashboardKPISkeleton,
  ProductGridSkeleton,
  FormSkeleton,
};
