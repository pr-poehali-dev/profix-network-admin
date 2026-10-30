import { createFileRoute } from "@tanstack/react-router";
import ClientOnlyFallback from "@/components/ClientOnlyFallback";
import Cabinet from "@/pages/Cabinet";

export const Route = createFileRoute("/cabinet")({
  ssr: false,
  pendingComponent: ClientOnlyFallback,
  component: Cabinet,
});
