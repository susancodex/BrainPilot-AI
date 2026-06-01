import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useConversations = () => {
  return useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: async () => {
      const { data } = await api.get("/chatbot/conversations/");
      return data;
    },
  });
};

export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: ["chat", "conversations", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/chatbot/conversations/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { message: string; conversation_id?: string }) => {
      const { data } = await api.post("/chatbot/send/", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      if (variables.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations", variables.conversation_id] });
      }
    },
  });
};

// Streaming hook handled directly in component typically, but we can provide a helper later if needed
