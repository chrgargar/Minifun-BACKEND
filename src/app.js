const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const logger = require('./config/logger');

const app = express();

// ==================== MIDDLEWARES DE SEGURIDAD ====================

// Helmet: protege contra vulnerabilidades web conocidas
app.use(helmet());

// CORS: controla qué dominios pueden acceder a la API
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting: previene abuso de la API
app.use('/api', generalLimiter);

// ==================== LOGGING ====================

// Morgan: logging HTTP con Winston
// Stream personalizado para integrar Morgan con Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// ==================== BODY PARSERS ====================

// JSON y URL-encoded parsers con límites de tamaño para prevenir DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== RUTAS ====================

// Rutas principales de la API
app.use('/api', routes);

// Ruta raíz: información básica de la API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MINIFUN Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout'
    }
  });
});

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada (404)
app.use(notFound);

// Manejo global de errores
app.use(errorHandler);

module.exports = app;
