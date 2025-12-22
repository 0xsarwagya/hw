import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, endpoints, get, post, put } from "../lib/api/client";
import { type Cart, type CartItem, cartSchema } from "../lib/validations/cart";

export const QUERY_KEYS = {
  cart: ["cart"],
};

export const useCart = () => {
  return useQuery({
    queryKey: QUERY_KEYS.cart,
    queryFn: async () => {
      const data = await get(endpoints.cart.get);
      return cartSchema.parse(data);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      variantId?: string;
      bundleId?: string;
      selections?: Record<string, string[]>; // For bundles: set ID -> variant IDs
      quantity: number;
    }) => {
      const data = await post(endpoints.cart.addItem, {
        type: input.bundleId ? "bundle" : "variant",
        productVariantId: input.variantId,
        bundleId: input.bundleId,
        selections: input.selections,
        quantity: input.quantity,
      });
      return cartSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, data);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      const data = await put(endpoints.cart.updateItem(itemId), { quantity });
      return cartSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, data);
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const data = await del(endpoints.cart.removeItem(itemId));
      return cartSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, data);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await del(endpoints.cart.clear);
      return cartSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.cart, data);
    },
  });
};
