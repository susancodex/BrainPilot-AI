import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useNotes = () => {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await api.get("/notes/");
      return data;
    },
  });
};

export const useNote = (id: string | null) => {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/notes/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; content: string; subject?: string }) => {
      const { data } = await api.post("/notes/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
      const { data } = await api.patch(`/notes/${id}/`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", variables.id] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};

export const useSummarizeNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notes/${id}/summarize/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
    },
  });
};

export const useGenerateFlashcards = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, count = 5 }: { id: string; count?: number }) => {
      const { data } = await api.post(`/notes/${id}/flashcards/generate/`, { count });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", "due"] });
    },
  });
};

export const useDueFlashcards = () => {
  return useQuery({
    queryKey: ["flashcards", "due"],
    queryFn: async () => {
      const { data } = await api.get("/notes/flashcards/due/");
      return data;
    },
  });
};

export const useReviewFlashcard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result: 'correct' | 'incorrect' }) => {
      const { data } = await api.post(`/notes/flashcards/${id}/review/`, { result });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", "due"] });
    },
  });
};
