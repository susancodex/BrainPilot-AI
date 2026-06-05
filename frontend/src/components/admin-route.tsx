import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { ComponentType } from "react";

export function AdminRoute({ component: Component }: { component: ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user?.is_staff) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}
