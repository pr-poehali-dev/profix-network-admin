import { createFileRoute } from "@tanstack/react-router";
import ClientOnlyFallback from "@/components/ClientOnlyFallback";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  pendingComponent: ClientOnlyFallback,
  component: Admin,
});
