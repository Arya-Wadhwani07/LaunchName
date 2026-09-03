import { Suspense } from "react";
import { LaunchWizard } from "@/features/launch/LaunchWizard";

export default function LaunchPage() {
  return (
    <Suspense fallback={null}>
      <LaunchWizard />
    </Suspense>
  );
}
