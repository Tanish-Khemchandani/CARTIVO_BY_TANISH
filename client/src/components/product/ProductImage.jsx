import { useState } from "react";
import { apiAssetUrl } from "../../api/client";

const fallbackImage = "/assets/brand/product-placeholder.svg";

export default function ProductImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const isLocalAsset = typeof src === "string" && src.startsWith("/") && !src.startsWith("//");
  const resolvedSrc = isLocalAsset && (src.startsWith("/uploads/products/") || src.startsWith("/api/uploads/")) ? apiAssetUrl(src) : src;

  return (
    <img
      src={failed || !isLocalAsset ? fallbackImage : resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
