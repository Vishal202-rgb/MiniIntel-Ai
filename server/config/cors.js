/**
 * Centralized CORS Configuration
 */

const getCorsOrigins = () => {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  if (process.env.CLIENT_URL) {
    defaultOrigins.push(process.env.CLIENT_URL);
  }

  return defaultOrigins.filter(Boolean);
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = getCorsOrigins();
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in development to prevent local port mismatch
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

module.exports = {
  corsOptions,
  getCorsOrigins
};
