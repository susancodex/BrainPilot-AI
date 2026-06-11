import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PDFDocument, PDFHighlight, PDFChatMessage } from "@/types";

export function usePDFs(subject?: string) {
  return useQuery<PDFDocument[]>({
    queryKey: ["pdfs", subject],
    queryFn: async () => {
      const params = subject ? { subject } : {};
      const res = await api.get("/pdfs/", { params });
      return res.data;
    },
  });
}

export function usePDF(id: string) {
  return useQuery<PDFDocument>({
    queryKey: ["pdfs", id],
    queryFn: async () => {
      const res = await api.get(`/pdfs/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUploadPDF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post("/pdfs/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as PDFDocument;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs"] });
    },
  });
}

export function useDeletePDF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pdfs/${id}/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs"] });
    },
  });
}

export function useUpdatePDF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; title?: string; subject?: string; tags?: string[] }) => {
      const res = await api.patch(`/pdfs/${id}/`, payload);
      return res.data as PDFDocument;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs"] });
    },
  });
}

export function usePDFChat(pdfId: string) {
  return useQuery<PDFChatMessage[]>({
    queryKey: ["pdfs", pdfId, "chat"],
    queryFn: async () => {
      const res = await api.get(`/pdfs/${pdfId}/chat/`);
      return res.data;
    },
    enabled: !!pdfId,
  });
}

export function useSendPDFMessage(pdfId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post(`/pdfs/${pdfId}/chat/`, { message });
      return res.data as PDFChatMessage;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs", pdfId, "chat"] });
    },
  });
}

export function usePDFHighlights(pdfId: string) {
  return useQuery<PDFHighlight[]>({
    queryKey: ["pdfs", pdfId, "highlights"],
    queryFn: async () => {
      const res = await api.get(`/pdfs/${pdfId}/highlights/`);
      return res.data;
    },
    enabled: !!pdfId,
  });
}

export function useCreateHighlight(pdfId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { text: string; page_number?: number; color?: string; note?: string }) => {
      const res = await api.post(`/pdfs/${pdfId}/highlights/`, data);
      return res.data as PDFHighlight;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs", pdfId, "highlights"] });
    },
  });
}

export function useDeleteHighlight(pdfId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (highlightId: string) => {
      await api.delete(`/pdfs/${pdfId}/highlights/${highlightId}/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdfs", pdfId, "highlights"] });
    },
  });
}
