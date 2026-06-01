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

export const useRecordRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { topic_id: string }) => {
      const { data } = await api.post("/revision/record/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", "topics"] });
    },
  });
};
