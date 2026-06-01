import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { setTokens, clearTokens, getAccessToken } from "@/lib/auth";

export const useAuth = () => {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me/");
      return data;
    },
    retry: false,
    enabled: !!getAccessToken(),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post("/auth/login/", credentials);
      setTokens(data.access, data.refresh);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post("/auth/register/", userData);
      return data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
      clearTokens();
    },
    onSettled: () => {
      queryClient.setQueryData(["auth", "me"], null);
      window.location.href = "/login";
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const { data } = await api.patch("/auth/me/profile/", profileData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  return {
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    isError: meQuery.isError,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
    updateProfile: updateProfileMutation,
  };
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (payload: { token: string }) => {
      const { data } = await api.post("/auth/verify-email/", payload);
      return data;
    },
  });
};

export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post("/auth/password/reset/", payload);
      return data;
    },
  });
};

export const usePasswordResetConfirm = () => {
  return useMutation({
    mutationFn: async (payload: { token: string; new_password: string }) => {
      const { data } = await api.post("/auth/password/reset/confirm/", payload);
      return data;
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const { data } = await api.post("/auth/me/change-password/", payload);
      return data;
    },
  });
};
