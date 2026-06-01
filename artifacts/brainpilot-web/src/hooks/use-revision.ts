import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useRevisionTopics = () => {
  return useQuery({
    queryKey: ["revision", "topics"],
    queryFn: async () => {
      const { data } = await api.get("/revision/topics/");
      return data;
    },
  });
};

export const useDueRevisionTopics = () => {
  return useQuery({
    queryKey: ["revision", "topics", "due"],
    queryFn: async () => {
      const { data } = await api.get("/revision/topics/due/");
      return data;
    },
  });
};

export const useWeakRevisionTopics = () => {
  return useQuery({
    queryKey: ["revision", "topics", "weak"],
    queryFn: async () => {
      const { data } = await api.get("/revision/topics/weak/");
      return data;
    },
  });
};

export const useCreateRevisionTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; topic: string; confidence_level?: number; notes?: string }) => {
      const { data } = await api.post("/revision/topics/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", "topics"] });
    },
  });
};

export const useRecordRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { topic_id: string; duration_minutes: number; confidence_after: number; notes?: string }) => {
      const { data } = await api.post("/revision/record/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", "topics"] });
    },
  });
};
