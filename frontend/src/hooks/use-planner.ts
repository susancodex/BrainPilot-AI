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
    mutationFn: async (payload: {
      subjects: string[];
      start_date: string;
      end_date: string;
      plan_type: string;
      daily_hours: number;
      exam_date?: string;
      weak_topics?: string[];
      goals?: string;
      syllabus_text?: string;
    }) => {
      const { data } = await api.post("/planner/plans/generate/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] });
    },
  });
};

export const useExtractSyllabus = () => {
  return useMutation({
    mutationFn: async (payload: { file?: File; text?: string }) => {
      const form = new FormData();
      if (payload.file) form.append("file", payload.file);
      if (payload.text) form.append("text", payload.text);
      const { data } = await api.post("/planner/extract-syllabus/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as { text: string; pages: number | null; source: "pdf" | "text" };
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
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/planner/sessions/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/planner/plans/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["planner", "sessions"] });
    },
  });
};
