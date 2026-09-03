import { Suspense } from "react";
import { Dashboard } from "@/features/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
