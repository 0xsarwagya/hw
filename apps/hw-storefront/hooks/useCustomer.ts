import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints, get, put } from "../lib/api/client";
import {
  customerProfileSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from "../lib/validations/customer";

export const QUERY_KEYS = {
  customer: ["customers", "me"],
};

export const useCustomerProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.customer,
    queryFn: async () => {
      const data = await get(endpoints.customers.me);
      return customerProfileSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const validated = updateProfileSchema.parse(input);
      const data = await put(endpoints.customers.updateProfile, validated);
      return customerProfileSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.customer, data);
    },
  });
};
