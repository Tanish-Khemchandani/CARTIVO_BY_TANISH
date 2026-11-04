import { useSearchParams } from "react-router-dom";
import ProductCatalog from "../components/catalog/ProductCatalog";

export default function Products() {
  const [searchParams] = useSearchParams();
  return (
    <ProductCatalog
      searchTerm={searchParams.get("search") || ""}
      showHero
      description="Thoughtful finds across tech, home, style and everyday essentials."
    />
  );
}
