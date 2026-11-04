import { useSearchParams } from "react-router-dom";
import ProductCatalog from "../components/catalog/ProductCatalog";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  return (
    <ProductCatalog
      searchTerm={searchParams.get("q") || ""}
      searchMode
      description="Search product names, brands and descriptions across the CARTIVO catalog."
    />
  );
}
