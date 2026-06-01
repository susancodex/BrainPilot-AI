import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useQuizzes = () => {
  return useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await api.get("/quizzes/");
      return data;
    },
  });
};

export const useQuiz = (id: string | null) => {
  return useQuery({
    queryKey: ["quizzes", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/quizzes/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

export const useGenerateQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { topic: string; num_questions?: number; question_types?: string[] }) => {
      const { data } = await api.post("/quizzes/generate/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, answers }: { id: string; answers: Array<{ question_id: string; answer: string }> }) => {
      const { data } = await api.post(`/quizzes/${id}/submit/`, { answers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", "attempts"] });
    },
  });
};

export const useAttempts = () => {
  return useQuery({
    queryKey: ["quizzes", "attempts"],
    queryFn: async () => {
      const { data } = await api.get("/quizzes/attempts/");
      return data;
    },
  });
};
