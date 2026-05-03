import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../api/client';

export function useApi(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchApi(endpoint)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
}
