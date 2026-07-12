import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="ml-auto h-8 w-32" />
      </div>
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}
