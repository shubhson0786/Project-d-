import { useCallback, useEffect, useState } from "react";
import api from "./api";
export const accountChanged = () => window.dispatchEvent(new Event("stashflow:account"));
export const money = value => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
export default function useAccountData(path, initial = null, refreshMs = 15000) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    api.get(path).then(response => { if (active) { setData(response.data); setError(""); } })
      .catch(requestError => { if (active) setError(requestError.response?.data?.error || "Could not load account data. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, revision]);
  useEffect(() => {
    window.addEventListener("stashflow:account", refresh);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, refreshMs);
    return () => { window.removeEventListener("stashflow:account", refresh); window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [refresh, refreshMs]);
  return { data, error, loading, refresh, setData };
}
