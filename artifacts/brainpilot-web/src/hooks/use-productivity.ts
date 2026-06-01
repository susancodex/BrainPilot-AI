import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const usePomodoro = () => {
  return useQuery({
    queryKey: ["productivity", "pomodoro"],
    queryFn: async () => {
      const { data } = await api.get("/productivity/pomodoro/");
      return data;
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { duration_minutes: number; subject?: string; note?: string }) => {
      const { data } = await api.post("/productivity/sessions/complete/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    },
  });
};

export const useStreak = () => {
  return useQuery({
    queryKey: ["productivity", "streak"],
    queryFn: async () => {
      const { data } = await api.get("/productivity/streak/");
      return data;
    },
  });
};

export const useFocusLogs = () => {
  return useQuery({
    queryKey: ["productivity", "focus-logs"],
    queryFn: async () => {
      const { data } = await api.get("/productivity/focus-logs/");
      return data;
    },
  });
};
