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
    mutationFn: async (payload: { subject: string; focus_minutes: number; task_description?: string }) => {
      const { data } = await api.post("/productivity/sessions/complete/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    },
  });
};

export const useStartPomodoro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; task_description?: string; work_duration_minutes?: number; break_duration_minutes?: number; pomodoros_planned?: number }) => {
      const { data } = await api.post("/productivity/pomodoro/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productivity", "pomodoro"] });
    },
  });
};

export const useCompletePomodoro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; pomodoros_completed: number }) => {
      const { data } = await api.post(`/productivity/pomodoro/${payload.id}/complete/`, { pomodoros_completed: payload.pomodoros_completed });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productivity", "pomodoro"] });
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
