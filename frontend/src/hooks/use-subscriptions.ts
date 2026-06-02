import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Subscription, PlanInfo } from "@/types";

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.get("/subscriptions/");
      return res.data;
    },
  });
}

export function usePlans() {
  return useQuery<PlanInfo[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res = await api.get("/subscriptions/plans/");
      return res.data;
    },
  });
}
