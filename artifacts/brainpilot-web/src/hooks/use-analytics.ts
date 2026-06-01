import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useTrends = () => {
  return useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/trends/");
      return data;
    },
  });
};

export const useSubjectBreakdown = () => {
  return useQuery({
    queryKey: ["analytics", "subjects"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/subjects/");
      return data;
    },
  });
};

export const useReport = () => {
  return useQuery({
    queryKey: ["analytics", "report"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/report/");
      return data;
    },
  });
};

export const useQuizPerformance = (days: number = 30) => {
  return useQuery({
    queryKey: ["analytics", "quiz-performance", days],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/quiz-performance/?days=${days}`);
      return data;
    },
  });
};

export const useRevisionStats = () => {
  return useQuery({
    queryKey: ["analytics", "revision-stats"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/revision/");
      return data;
    },
  });
};
