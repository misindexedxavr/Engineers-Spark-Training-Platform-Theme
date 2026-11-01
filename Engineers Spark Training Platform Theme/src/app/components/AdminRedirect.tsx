import React, { useEffect } from "react";

export default function AdminRedirect(): null {
  useEffect(() => {
    // Preserve any subpath after /admin and forward query/hash
    const current = window.location.pathname + window.location.search + window.location.hash;
    // If pathname already contains /admin, keep the rest; otherwise append full pathname
    const suffix = current.startsWith("/admin") ? current.replace(/^\/admin/, "") : current;
    window.location.href = `/admin${suffix}`;
  }, []);

  return null;
}
