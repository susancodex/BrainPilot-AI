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
    mutationFn: async (payload: {
      subject: string;
      topic?: string;
      difficulty?: string;
      question_count?: number;
      note_id?: string;
      context?: string;
    }) => {
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
    mutationFn: async ({
      id,
      answers,
      time_taken_seconds,
    }: {
      id: string;
      answers: Array<{ question_index: number; answer: string }>;
      time_taken_seconds: number;
    }) => {
      const { data } = await api.post(`/quizzes/${id}/submit/`, { answers, time_taken_seconds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", "attempts"] });
    },
  });
};

export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      title?: string;
      subject?: string;
      topic?: string;
      difficulty?: string;
      questions?: Array<Record<string, unknown>>;
    }) => {
      const { data } = await api.patch(`/quizzes/${id}/`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes", variables.id] });
    },
  });
};

export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quizzes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
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
