import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { endpoints, get } from "../lib/api/client";
import { variantSchema } from "../lib/validations/product";

/**
 * Fetch all variants from products and extract unique colors and sizes
 * This is used for bundle builders to get available options
 */
export const useAvailableVariants = () => {
  return useQuery({
    queryKey: ["availableVariants"],
    queryFn: async () => {
      // Fetch products (limit to reasonable number for bundle products)
      const productsData = await get(
        `${endpoints.products.list}?limit=50&status=active`,
      );
      const products = z
        .object({
          data: z.array(
            z.object({
              id: z.string().uuid(),
            }),
          ),
        })
        .parse(productsData);

      // Fetch variants for all products in parallel
      const variantPromises = products.data.map(async (product) => {
        try {
          const variants = await get(endpoints.products.variants(product.id));
          return Array.isArray(variants)
            ? variants.map((v) => variantSchema.parse(v))
            : [];
        } catch (error) {
          console.error(
            `Failed to fetch variants for product ${product.id}:`,
            error,
          );
          return [];
        }
      });

      const allVariantsArrays = await Promise.all(variantPromises);
      const allVariants = allVariantsArrays.flat();

      // Extract unique colors and sizes
      const colors = Array.from(
        new Set(
          allVariants
            .map((v) => v.color)
            .filter((color): color is string => !!color),
        ),
      ).sort();

      const sizes = Array.from(
        new Set(
          allVariants
            .map((v) => v.size)
            .filter((size): size is string => !!size),
        ),
      ).sort();

      return {
        variants: allVariants,
        colors,
        sizes,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
