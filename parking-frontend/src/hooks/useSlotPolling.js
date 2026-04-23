import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export function useSlotPolling(mallId, intervalMs = 30000) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSlots = useCallback(async () => {
    if (!mallId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/slots/mall/${mallId}`);
      setSlots(res.data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slots.");
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    fetchSlots();
    const id = setInterval(fetchSlots, intervalMs);
    return () => clearInterval(id);
  }, [fetchSlots, intervalMs]);

  return { slots, loading, error, lastUpdated, refetch: fetchSlots };
}
