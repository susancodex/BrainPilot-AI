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
      console.log('Creating note with payload:', payload);
      const { data } = await api.post("/notes/", payload);
      console.log('Note created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Create note onSuccess, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
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

export const useFlashcards = () => {
  return useQuery({
    queryKey: ["flashcards", "all"],
    queryFn: async () => {
      const { data } = await api.get("/notes/flashcards/");
      return data;
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

export const useCreateFlashcard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      question: string;
      answer: string;
      subject?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      note_id?: string;
    }) => {
      const { data } = await api.post("/notes/flashcards/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", "all"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", "due"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};

export const useUpdateFlashcard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      question?: string;
      answer?: string;
      subject?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    }) => {
      const { data } = await api.patch(`/notes/flashcards/${id}/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", "all"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", "due"] });
    },
  });
};

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/flashcards/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", "all"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", "due"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};
