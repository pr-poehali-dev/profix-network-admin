import { createFileRoute } from "@tanstack/react-router";
import Invoice from "@/pages/Invoice";

export const Route = createFileRoute("/invoice/$id")({
  component: Invoice,
});
