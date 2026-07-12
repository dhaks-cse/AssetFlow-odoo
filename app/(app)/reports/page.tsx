import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getAssetUtilization,
  getBookingHeatmapByHour,
  getMaintenanceFrequencyByCategory,
} from "@/lib/queries/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AssetUtilizationChart } from "@/components/reports/asset-utilization-chart";
import { MaintenanceFrequencyChart } from "@/components/reports/maintenance-frequency-chart";
import { BookingHeatmapChart } from "@/components/reports/booking-heatmap-chart";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [utilization, maintenanceFrequency, bookingHeatmap] = await Promise.all([
    getAssetUtilization(),
    getMaintenanceFrequencyByCategory(),
    getBookingHeatmapByHour(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Three fixed views. No builder, no export.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Asset Utilization</CardTitle>
            <CardDescription>Fleet snapshot by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetUtilizationChart data={utilization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Frequency</CardTitle>
            <CardDescription>Requests raised, by asset category.</CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceFrequencyChart data={maintenanceFrequency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Heatmap</CardTitle>
            <CardDescription>Bookings by hour of day.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingHeatmapChart data={bookingHeatmap} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
