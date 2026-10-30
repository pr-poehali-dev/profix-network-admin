import { createFileRoute } from "@tanstack/react-router";
import Requisites from "@/pages/Requisites";

export const Route = createFileRoute("/requisites")({
  component: Requisites,
});
