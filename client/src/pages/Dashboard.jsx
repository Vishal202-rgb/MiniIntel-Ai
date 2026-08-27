import React, { useState } from 'react';
import useDocuments from '../hooks/useDocuments';
import { uploadDocument, getDocumentById, deleteDocument, retryDocument } from '../services/api';
import DropZone from '../components/upload/DropZone';
import UploadProgress from '../components/upload/UploadProgress';
import DocumentFilters from '../components/documents/DocumentFilters';
import DocumentList from '../components/documents/DocumentList';
import DocumentPreview from '../components/documents/DocumentPreview';

const Dashboard = () => {
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const { documents, loading, fetchDocuments } = useDocuments(filters);
  const [uploads, setUploads] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleUpload = async (file) => {
    const uploadId = Date.now().toString();
    setUploads((prev) => [
      ...prev,
      { id: uploadId, name: file.name, progress: 0, status: 'uploading' }
    ]);

    try {
      await uploadDocument(file, (progress) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
        );
      });
      
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'success', progress: 100 } : u))
      );
      fetchDocuments(filters);
      
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, status: 'error', error: error.response?.data?.message || 'Upload failed' }
            : u
        )
      );
    }
  };

  const handleDismissUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handlePreview = async (id) => {
    try {
      const response = await getDocumentById(id);
      setPreviewDoc(response.data);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Failed to preview document', error);
      alert('Failed to load document preview');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      fetchDocuments(filters);
    } catch (error) {
      console.error('Failed to delete document', error);
      alert('Failed to delete document');
    }
  };

  const handleRetry = async (id) => {
    try {
      await retryDocument(id);
      setPreviewOpen(false);
      fetchDocuments(filters);
    } catch (error) {
      console.error('Failed to retry document', error);
      alert('Failed to retry processing');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Document Management
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {documents?.length || 0} documents total
          </p>
        </div>
      </div>

      <DropZone onUpload={handleUpload} />
      <UploadProgress uploads={uploads} onDismiss={handleDismissUpload} />
      
      <DocumentFilters
        search={filters.search}
        type={filters.type}
        status={filters.status}
        onSearchChange={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onTypeChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
        onStatusChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
      />
      
      <DocumentList
        documents={documents}
        loading={loading}
        onPreview={handlePreview}
        onDelete={handleDelete}
      />

      <DocumentPreview
        document={previewDoc}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default Dashboard;
