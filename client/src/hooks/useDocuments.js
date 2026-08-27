import { useState, useEffect, useCallback } from 'react';
import { getDocuments } from '../services/api';

const useDocuments = (filters = {}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await getDocuments(params);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(filters);
  }, [filters.search, filters.type, filters.status]);

  useEffect(() => {
    const hasPending = documents.some(
      (doc) => doc.status === 'pending' || doc.status === 'processing'
    );
    let interval;
    if (hasPending) {
      interval = setInterval(() => {
        fetchDocuments(filters);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [documents, filters, fetchDocuments]);

  return { documents, loading, error, fetchDocuments };
};

export default useDocuments;
