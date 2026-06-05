import { Redirect } from "wouter";
import { isAuthenticated } from "@/lib/auth";
import type { ComponentType } from "react";

export function PrivateRoute({ component: Component }: { component: ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/" />;
  }
  return <Component />;
}
