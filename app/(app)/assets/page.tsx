import Link from "next/link";
import type { AssetStatus } from "@prisma/client";

import { getAssetFilterOptions, getAssets } from "@/lib/queries/assets";
import { AssetFilters } from "@/components/assets/asset-filters";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VALID_STATUSES = new Set<AssetStatus>([
  "AVAILABLE",
  "ALLOCATED",
  "RESERVED",
  "UNDER_MAINTENANCE",
  "LOST",
  "RETIRED",
  "DISPOSED",
]);

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; department?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && VALID_STATUSES.has(params.status as AssetStatus)
      ? (params.status as AssetStatus)
      : undefined;

  const [assets, { categories, departments }] = await Promise.all([
    getAssets({
      q: params.q,
      categoryId: params.category,
      status,
      departmentId: params.department,
    }),
    getAssetFilterOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Asset Directory</h1>
        <p className="text-sm text-muted-foreground">
          {assets.length} asset{assets.length === 1 ? "" : "s"}
        </p>
      </div>

      <AssetFilters categories={categories} departments={departments} />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Current Holder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No assets match these filters.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset, i) => {
                const active = asset.allocations[0];
                const holder = active?.holder?.name ?? active?.department?.name ?? "—";
                return (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                    style={{ animationDelay: `${Math.min(i, 20) * 25}ms`, animationDuration: "300ms" }}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/assets/${asset.id}`} className="block">
                        {asset.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/assets/${asset.id}`} className="block">
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.category.name}
                    </TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.location}</TableCell>
                    <TableCell className="text-muted-foreground">{holder}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
