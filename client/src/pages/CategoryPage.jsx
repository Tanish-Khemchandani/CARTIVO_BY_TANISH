import { useParams } from "react-router-dom";
import ProductCatalog from "../components/catalog/ProductCatalog";

export default function CategoryPage() {
  const { slug } = useParams();
  return <ProductCatalog categorySlug={slug} />;
}
