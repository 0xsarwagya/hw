import { Header } from "@/components/layout/header";
import { ProductList } from "@/components/products/product-list";

export default function ProductsPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto space-y-6 p-6">
        <ProductList />
      </div>
    </>
  );
}
