import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { api } from "../../api/client";
import Modal from "../components/ui/Modal";
import BarChart from "../components/charts/BarChart";
import Pagination from "../components/ui/Pagination";
import { SummaryStrip, Toolbar } from "../components/ui/Toolbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "HIDDEN", "REJECTED"];

const STATUS_BADGE = {
  PENDING: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  APPROVED: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  HIDDEN: "bg-[var(--color-muted)]/15 text-[var(--color-muted)]",
  REJECTED: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
};

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ pending: 0, approved: 0, hidden: 0, rejected: 0 });
  const [filter, setFilter] = useState("PENDING");
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async (activeFilter, ratingFilter, term, requestedPage) => {
    const params = new URLSearchParams({ page: String(requestedPage), limit: "20" });
    if (activeFilter !== "ALL") params.set("status", activeFilter);
    if (ratingFilter) params.set("rating", ratingFilter);
    if (term) params.set("search", term);

    const res = await api.get(`/admin/reviews?${params.toString()}`);
    setReviews(res.data || []);
    setMeta(res.meta || { pending: 0, approved: 0, hidden: 0, rejected: 0 });
    setStatus("done");
  }, []);

  // a new filter means a new result set, so start from the first page
  useEffect(() => {
    setPage(1);
  }, [filter, rating, debouncedSearch]);

  useEffect(() => {
    setStatus("loading");
    load(filter, rating, debouncedSearch, page).catch(() => setStatus("error"));
  }, [filter, rating, debouncedSearch, page, load]);

  function resetFilters() {
    setFilter("ALL");
    setRating("");
    setSearch("");
  }

  async function changeStatus(review, nextStatus, moderationNote) {
    setBusyId(review._id);
    try {
      await api.patch(`/admin/reviews/${review._id}`, { status: nextStatus, moderationNote });
      setNotice(`Review ${nextStatus.toLowerCase()}.`);
      setNoteFor(null);
      setNoteText("");
      if (filter !== "ALL") setFilter("ALL"); // the review left the filtered list
      else await load(filter, rating, debouncedSearch, page);
    } catch (requestError) {
      setNotice(requestError.message || "Could not update the review.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/reviews/${deleting._id}`);
      setNotice("Review deleted.");
      await load(filter, rating, debouncedSearch, page);
      setDeleting(null);
    } catch (requestError) {
      setNotice(requestError.message || "Could not delete the review.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Product reviews</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Approve, hide or reject customer reviews. Approved reviews feed the product's average rating.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === tab
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
            }`}
          >
            {tab !== "ALL" ? tab.charAt(0) + tab.slice(1).toLowerCase() : "All"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Toolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Review text or author…"
          onReset={resetFilters}
          filters={[
            {
              name: "rating",
              label: "Rating",
              value: rating,
              onChange: setRating,
              options: [
                { value: "", label: "Any rating" },
                ...[5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${stars} star${stars === 1 ? "" : "s"}` })),
              ],
            },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SummaryStrip
          items={[
            { label: "Reviews", value: meta.totalReviews ?? 0 },
            { label: "Average rating", value: meta.average ? `${meta.average} / 5` : "—", hint: `${meta.rated ?? 0} star${meta.rated === 1 ? "" : "s"} given` },
            { label: "Pending", value: meta.pending ?? 0, tone: meta.pending > 0 ? "warning" : "default" },
            { label: "Approved", value: meta.approved ?? 0 },
          ]}
        />

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Star distribution
          </h2>
          <p className="mb-3 mt-1 text-xs text-[var(--color-muted)]">Every review, whatever the current filters.</p>
          <BarChart
            points={(meta.distribution || []).map((row) => ({ key: String(row.rating), label: `${row.rating}★`, fullLabel: `${row.rating} star reviews`, count: row.count }))}
            primaryKey="count"
            formatPrimary={(value) => `${value}`}
            height={140}
            emptyMessage="No reviews yet."
          />
        </section>
      </div>

      {notice && <p className="mt-4 text-sm text-[var(--color-primary-bright)]">{notice}</p>}
      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load reviews.</p>}

      {status === "done" && (
        <div className="mt-5 grid gap-3">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 font-semibold text-white" aria-label={`${review.rating} out of 5`}>
                    {review.rating}
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[review.status] || ""}`}>{review.status}</span>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{new Date(review.createdAt).toLocaleString("en-IN")}</span>
              </div>

              <p className="mt-2 text-sm text-[var(--color-ink)]">{review.comment}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                <span>By <b className="text-white">{review.customer?.name || review.authorName}</b>{review.customer ? ` (${review.customer.email})` : ""}</span>
                {review.product ? (
                  <Link to="/admin/products" className="text-[var(--color-primary-bright)] hover:underline">
                    {review.product.name}
                  </Link>
                ) : (
                  <span>Product removed</span>
                )}
                {review.moderationNote && <span>Note: {review.moderationNote}</span>}
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleting(review)}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNoteFor(review);
                    setNoteText("");
                  }}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
                >
                  Reject with note
                </button>
                {review.status !== "HIDDEN" && (
                  <button
                    type="button"
                    disabled={busyId === review._id}
                    onClick={() => changeStatus(review, "HIDDEN")}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
                  >
                    Hide
                  </button>
                )}
                {review.status !== "APPROVED" && (
                  <button
                    type="button"
                    disabled={busyId === review._id}
                    onClick={() => changeStatus(review, "APPROVED")}
                    className="rounded-lg bg-[var(--color-success)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
              </div>
            </article>
          ))}
          {reviews.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
              No {filter === "ALL" ? "" : filter.toLowerCase() + " "}reviews yet.
            </p>
          )}
        </div>
      )}

      <Modal
        open={noteFor !== null}
        title="Reject review"
        maxWidth="max-w-md"
        onClose={() => setNoteFor(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setNoteFor(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busyId === noteFor?._id}
              onClick={() => changeStatus(noteFor, "REJECTED", noteText)}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {busyId === noteFor?._id ? "Rejecting..." : "Reject review"}
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Rejecting removes the review from the storefront and the product rating.
        </p>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Internal moderation note (optional)"
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
        />
      </Modal>

      <Modal
        open={deleting !== null}
        title="Delete review"
        maxWidth="max-w-md"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Delete permanently
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-ink)]">
          Permanently delete this {deleting ? `${deleting.rating}-star` : ""} review? If it is currently approved the
          product rating is recalculated without it.
        </p>
      </Modal>
    </div>
  );
}
