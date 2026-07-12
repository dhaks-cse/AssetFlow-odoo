import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
