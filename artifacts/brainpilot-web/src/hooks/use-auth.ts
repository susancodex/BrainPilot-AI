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
      // After unwrap interceptor, data = { access, refresh, user }
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

  // Update user fields (first_name, last_name) via PATCH /auth/me/
  const updateUserMutation = useMutation({
    mutationFn: async (fields: { first_name?: string; last_name?: string }) => {
      const { data } = await api.patch("/auth/me/", fields);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  // Update extended profile fields via PATCH /auth/me/profile/
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      first_name?: string;
      last_name?: string;
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
      const promises: Promise<any>[] = [];
      // Update user name if provided
      if (first_name !== undefined || last_name !== undefined) {
        promises.push(api.patch("/auth/me/", { first_name, last_name }));
      }
      // Update profile fields if any exist
      if (Object.keys(profileFields).length > 0) {
        promises.push(api.patch("/auth/me/profile/", profileFields));
      }
      await Promise.all(promises);
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
    updateUser: updateUserMutation,
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
