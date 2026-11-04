import { useEffect, useState } from "react";
import { api } from "../../api/client";
import StatusBadge from "../components/ui/StatusBadge";

export default function ContactInquiriesAdmin() {
  const [inquiries, setInquiries] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .get("/contact")
      .then((res) => {
        setInquiries(res.data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function markRead(id) {
    await api.patch(`/contact/${id}`, { status: "READ" });
    setInquiries((prev) => prev.map((i) => (i._id === id ? { ...i, status: "READ" } : i)));
  }

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-xl font-semibold text-white">Contact inquiries</h1>

      {status === "loading" && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading...</p>}
      {status === "error" && <p className="mt-6 text-sm text-[var(--color-danger)]">Could not load inquiries.</p>}

      {status === "done" && (
        <div className="mt-6 flex flex-col gap-3">
          {inquiries.map((inq) => (
            <div key={inq._id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{inq.name} - {inq.email}</p>
                <StatusBadge status={inq.status} />
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{inq.message}</p>
              {inq.status === "NEW" && (
                <button
                  onClick={() => markRead(inq._id)}
                  className="mt-3 rounded-lg bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
          {inquiries.length === 0 && <p className="text-sm text-[var(--color-muted)]">No inquiries yet.</p>}
        </div>
      )}
    </div>
  );
}
