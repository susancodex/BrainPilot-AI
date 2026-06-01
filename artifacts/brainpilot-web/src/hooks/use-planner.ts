import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const usePlans = () => {
  return useQuery({
    queryKey: ["planner", "plans"],
    queryFn: async () => {
      const { data } = await api.get("/planner/plans/");
      return data;
    },
  });
};

export const usePlan = (id: string | null) => {
  return useQuery({
    queryKey: ["planner", "plans", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/planner/plans/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

export const useGeneratePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { topic: string; duration_days: number; daily_hours: number }) => {
      const { data } = await api.post("/planner/plans/generate/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] });
    },
  });
};

export const useSessions = () => {
  return useQuery({
    queryKey: ["planner", "sessions"],
    queryFn: async () => {
      const { data } = await api.get("/planner/sessions/");
      return data;
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
      const { data } = await api.patch(`/planner/sessions/${id}/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] }); // in case it affects plan overall
    },
  });
};
