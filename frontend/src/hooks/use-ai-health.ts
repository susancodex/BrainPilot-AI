import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AiProviderHealth {
  provider: string;
  healthy: boolean;
  configured: boolean;
  consecutive_failures: number;
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
}

export interface AiHealthReport {
  providers: AiProviderHealth[];
  configured_count: number;
  available_count: number;
  status: "operational" | "degraded" | "unconfigured";
}

export const useAiHealth = () => {
  return useQuery({
    queryKey: ["ai", "health"],
    queryFn: async () => {
      const { data } = await api.get<AiHealthReport>("/ai/health/");
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};
