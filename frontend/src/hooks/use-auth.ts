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
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post("/auth/login/", credentials);
      setTokens(data.access, data.refresh);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      password_confirm: string;
    }) => {
      const { data } = await api.post("/auth/register/", userData);
      setTokens(data.access, data.refresh);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refresh = getAccessToken() ? localStorage.getItem("refresh_token") : null;
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
      clearTokens();
    },
    onSettled: () => {
      queryClient.setQueryData(["auth", "me"], null);
      window.location.href = "/";
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.post("/auth/me/profile/avatar/", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/auth/me/profile/avatar/");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      first_name?: string;
      last_name?: string;
      avatar_preset?: string;
      bio?: string;
      phone?: string;
      timezone?: string;
      institution?: string;
      field_of_study?: string;
      academic_level?: string;
      study_goal_hours_per_week?: number;
      preferred_study_time?: string;
    }) => {
      const { first_name, last_name, ...profileFields } = profileData;
      if (first_name !== undefined || last_name !== undefined) {
        await api.patch("/auth/me/", { first_name, last_name });
      }
      if (Object.keys(profileFields).length > 0) {
        await api.patch("/auth/me/profile/", profileFields);
      }
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
    uploadAvatar: uploadAvatarMutation,
    removeAvatar: removeAvatarMutation,
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
