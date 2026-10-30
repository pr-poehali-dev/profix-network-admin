import { createFileRoute } from "@tanstack/react-router";
import ClientOnlyFallback from "@/components/ClientOnlyFallback";
import TechPortal from "@/pages/TechPortal";

export const Route = createFileRoute("/techportal")({
  ssr: false,
  pendingComponent: ClientOnlyFallback,
  component: TechPortal,
});
