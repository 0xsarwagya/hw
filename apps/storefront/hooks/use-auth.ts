"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endpoints, get, post } from "@/lib/api/client";
import {
  clearGuestSessionId,
  removeToken,
  setToken,
} from "@/lib/utils/storage";
import {
  authResponseSchema,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  registerSchema,
  userProfileSchema,
} from "@/lib/validations/auth";

/**
 * Get current user profile
 */
export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await get(endpoints.auth.me);
      return userProfileSchema.parse(data);
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const validated = loginSchema.parse(input);
      const data = await post(endpoints.auth.login, validated);
      const response = authResponseSchema.parse(data);

      // Store token
      setToken(response.access_token);

      return response;
    },
    onSuccess: () => {
      // Invalidate auth query to refetch user
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      // Invalidate cart to merge guest cart
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Logged in successfully");
      router.push("/account");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const validated = registerSchema.parse(input);
      const data = await post(endpoints.auth.register, validated);
      const response = authResponseSchema.parse(data);

      // Store token
      setToken(response.access_token);

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Account created successfully");
      router.push("/account");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await post(endpoints.auth.logout);
    },
    onSuccess: () => {
      removeToken();
      clearGuestSessionId();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Logout failed");
      // Still clear local state even if API call fails
      removeToken();
      clearGuestSessionId();
      queryClient.clear();
      router.push("/");
    },
  });
}
