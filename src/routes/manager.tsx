import { createFileRoute } from "@tanstack/react-router";
import ClientOnlyFallback from "@/components/ClientOnlyFallback";
import ManagerApp from "@/pages/ManagerApp";

export const Route = createFileRoute("/manager")({
  ssr: false,
  pendingComponent: ClientOnlyFallback,
  component: ManagerApp,
});
