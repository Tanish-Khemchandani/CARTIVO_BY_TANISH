import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, TriangleAlert } from "lucide-react";
import { uploadProductPhotos } from "../../../api/uploads";
import { apiAssetUrl } from "../../../api/client";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 8;
const MAX_FILE_MB = 8;

// Sample the rendered image at 8x8 luminance via canvas, producing a 64-bit
// hex hash. Lets us warn about identical photos BEFORE they hit the server.
async function canvasHash8x8(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 8, 8);
  bitmap.close?.();
  const { data } = ctx.getImageData(0, 0, 8, 8);
  const gray = [];
  for (let i = 0; i < 64; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    gray.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  const mean = gray.reduce((a, b) => a + b, 0) / 64;
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += (gray[i] > mean ? 8 : 0) | (gray[i + 1] > mean ? 4 : 0) | (gray[i + 2] > mean ? 2 : 0) | (gray[i + 3] > mean ? 1 : 0);
  }
  return hex;
}

function hamming(a, b) {
  if (!/^[\da-f]{16}$/i.test(a || "") || !/^[\da-f]{16}$/i.test(b || "")) return Infinity;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

export default function PhotoUploader({ images, setImages }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [problems, setProblems] = useState([]); // { file, message }

  useEffect(() => {
    let cancelled = false;
    async function hashSavedImages() {
      const pending = images.filter((image) => !image.hash && image.url);
      if (!pending.length) return;
      const hashes = await Promise.all(pending.map(async (image) => {
        try {
          const response = await fetch(apiAssetUrl(image.url), { credentials: "include" });
          if (!response.ok) return null;
          const blob = await response.blob();
          const file = new File([blob], "saved-product-photo", { type: blob.type });
          return { url: image.url, hash: await canvasHash8x8(file) };
        } catch {
          return null;
        }
      }));
      if (cancelled) return;
      const byUrl = new Map(hashes.filter(Boolean).map((item) => [item.url, item.hash]));
      if (byUrl.size) {
        setImages((current) => current.map((image) => ({ ...image, hash: image.hash || byUrl.get(image.url) || "" })));
      }
    }
    hashSavedImages();
    return () => { cancelled = true; };
  }, [images, setImages]);

  async function handleFiles(fileList) {
    const files = [...(fileList || [])];
    if (files.length === 0) return;
    setProblems([]);
    setUploading(true);

    const localProblems = [];
    const room = MAX_PHOTOS - images.length;
    const accepted = [];

    // 1) pre-flight: type/size + browser-side duplicate detection
    for (const file of files) {
      if (accepted.length >= room) {
        localProblems.push({ file: file.name, message: `You can upload at most ${MAX_PHOTOS} photos per product` });
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        localProblems.push({ file: file.name, message: "Only JPG, PNG or WebP photos" });
        continue;
      }
      if (file.size < 8 * 1024) {
        localProblems.push({ file: file.name, message: "Too small to be a real product photo (min 8 KB)" });
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        localProblems.push({ file: file.name, message: `Larger than ${MAX_FILE_MB} MB` });
        continue;
      }
      try {
        const hash = await canvasHash8x8(file);
        const clash = [...images, ...accepted].find((img) => hamming(img.hash, hash) < 4);
        if (clash) {
          localProblems.push({ file: file.name, message: "Looks identical to a photo already on the product" });
          continue;
        }
        accepted.push({ file, hash });
      } catch {
        localProblems.push({ file: file.name, message: "Could not read this image" });
      }
    }

    if (accepted.length === 0) {
      setProblems(localProblems);
      setUploading(false);
      return;
    }

    // 2) server upload (server re-checks everything authoritatively)
    try {
      const res = await uploadProductPhotos(accepted.map((a) => a.file));
      const serverAccepted = res.data || [];
      const merged = [];
      for (const item of serverAccepted) {
        const local = accepted[item.index];
        merged.push({
          url: item.url,
          width: item.width,
          height: item.height,
          hash: local?.hash || "",
        });
      }
      setImages((prev) => [...prev, ...merged]);

      // server-side rejections (e.g. subtle near-duplicates the browser missed)
      for (const rejected of res.rejected || []) {
        localProblems.push({ file: rejected.file, message: rejected.message });
      }
      setProblems(localProblems);
    } catch (err) {
      setProblems([{ file: "Upload", message: err.message || "Upload failed" }]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url) {
    setImages((prev) => prev.filter((img) => img.url !== url));
  }

  function move(url, direction) {
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.url === url);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  }

  const enough = images.length >= MIN_PHOTOS;

  return (
    <div className="sm:col-span-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-sm font-medium text-[var(--color-ink)]">
          Product photos
        </span>
        <span className={`text-xs font-semibold ${enough ? "text-emerald-400" : "text-amber-400"}`}>
          {images.length}/{MIN_PHOTOS} required {enough ? "✓" : `— add at least ${MIN_PHOTOS - images.length} more`}
        </span>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        Add at least 3 distinct photos of the product — different angles or views, not the same photo repeated. JPG/PNG/WebP, min 400×400, max 8 MB each, up to {MAX_PHOTOS} photos.
      </p>

      {/* preview grid */}
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, index) => (
            <li key={img.url} className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
              <img src={apiAssetUrl(img.url)} alt={`Product photo ${index + 1}`} className="aspect-square w-full object-contain" />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
                <span className="flex gap-1">
                  <button type="button" aria-label="Move photo left" onClick={() => move(img.url, -1)} disabled={index === 0}
                    className="rounded bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">←</button>
                  <button type="button" aria-label="Move photo right" onClick={() => move(img.url, 1)} disabled={index === images.length - 1}
                    className="rounded bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">→</button>
                </span>
                <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => removeImage(img.url)}
                  className="rounded bg-black/60 p-1 text-white hover:bg-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* dropzone-ish button */}
      <button
        type="button"
        disabled={uploading || images.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ImagePlus className="h-5 w-5" />
        {uploading ? "Checking & uploading photos..." : images.length >= MAX_PHOTOS ? `Maximum of ${MAX_PHOTOS} photos reached` : "Click to choose photos (JPG, PNG, WebP)"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* per-file problems */}
      {problems.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1">
          {problems.map((p, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span><strong>{p.file}:</strong> {p.message}</span>
            </li>
          ))}
        </ul>
      )}

      {!enough && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Saving is blocked until the product has 3 distinct photos.
        </p>
      )}
    </div>
  );
}
