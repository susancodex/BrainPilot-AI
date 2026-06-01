import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/");
      return data;
    },
  });
};
