import { ProductFormContent } from "@/components/products/product-form-content";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="container mx-auto space-y-6 p-6">
      <ProductFormContent productId={id} />
    </div>
  );
}
