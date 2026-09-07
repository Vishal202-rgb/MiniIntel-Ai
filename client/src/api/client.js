import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Central Axios instance for MineIntel AI React Client
 * Pre-configured with /api/v1 base URL and Bearer JWT handling.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error('Error reading auth token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Standardize error formatting and preserve response
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    error.formattedMessage = customMessage;
    return Promise.reject(error);
  }
);

/**
 * Centralized file upload helper using multipart/form-data
 *
 * @param {string} url - Target API path
 * @param {File|FormData} fileOrFormData - File object or complete FormData
 * @param {object} [options] - Configuration options
 * @param {function} [options.onProgress] - Callback for upload percentage (0-100)
 * @param {string} [options.fieldName='file'] - Form field name if passing a File
 * @param {object} [options.extraData={}] - Additional fields to append to FormData
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const uploadFile = (url, fileOrFormData, options = {}) => {
  const { onProgress, fieldName = 'file', extraData = {}, headers = {} } = options;
  let formData;

  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append(fieldName, fileOrFormData);
    if (extraData && typeof extraData === 'object') {
      Object.entries(extraData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
        }
      });
    }
  }

  return apiClient.post(url, formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};

/**
 * Centralized file download / export helper
 * Handles binary stream / Blob responses and triggers browser file save.
 *
 * @param {string} url - Target API path
 * @param {string} [defaultFilename='download'] - Fallback filename
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const downloadFile = async (url, defaultFilename = 'download', params = {}) => {
  const response = await apiClient.get(url, {
    params,
    responseType: 'blob',
  });

  let filename = defaultFilename;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  if (typeof window !== 'undefined' && window.document) {
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  return response;
};

export default apiClient;
