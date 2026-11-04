import { useEffect, useState } from "react";
import { api } from "../api/client";

// Same fallbacks as the footer, so support details never render blank while
// /api/settings is loading or if it is unreachable.
export const SETTINGS_FALLBACK = {
  siteName: "CARTIVO",
  contactEmail: "sumitback1@gmail.com",
  contactPhone: "9687697881",
  address: "Vadodara, Gujarat, India",
  supportHours: "Mon - Sat: 9:00am - 6:00pm",
};

const PUBLIC_KEYS = ["siteName", "contactEmail", "contactPhone", "address", "supportHours"];

export default function useSettings() {
  const [settings, setSettings] = useState(SETTINGS_FALLBACK);

  useEffect(() => {
    let active = true;
    api
      .get("/settings")
      .then((response) => {
        if (!active) return;
        setSettings((current) => {
          const next = { ...current };
          for (const key of PUBLIC_KEYS) {
            const value = response.data?.[key];
            if (typeof value === "string" && value.trim()) next[key] = value.trim();
          }
          return next;
        });
      })
      .catch(() => {
        // keep the fallbacks; the page is still useful without the request
      });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
