import { Header } from "@/components/layout/header";
import { ProductFormContent } from "@/components/products/product-form-content";

export default function NewProductPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto space-y-6 p-6">
        <ProductFormContent />
      </div>
    </>
  );
}
