import { useTheme } from "../../context/ThemeContext";

// Both files are the original CARTIVO artwork. The dark one only lifts the
// navy tones so the cart and wordmark stay readable on the dark header and
// footer; light mode uses the untouched logo.
const LOGO_SRC = {
  light: "/assets/brand/cartivo-logo-light.png",
  dark: "/assets/brand/cartivo-logo-dark.png",
};

/*
 * Responsive by default: the intrinsic 800x208 size fixes the aspect ratio,
 * `w-auto max-w-full` lets it shrink inside a flexing header, and each caller
 * supplies its own height steps through className (e.g. "h-8 sm:h-10").
 */
export default function BrandLogo({ className = "", ...props }) {
  const { theme } = useTheme();

  return (
    <img
      src={LOGO_SRC[theme === "dark" ? "dark" : "light"]}
      alt="CARTIVO"
      width={800}
      height={208}
      decoding="async"
      className={`w-auto max-w-full object-contain ${className}`}
      {...props}
    />
  );
}
