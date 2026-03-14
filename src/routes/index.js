const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const logsRoutes = require('./logsRoutes');
const gameRoutes = require('./gameRoutes');
const preferencesRoutes = require('./preferencesRoutes');

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MINIFUN Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de logs
router.use('/logs', logsRoutes);

// Rutas de juegos (progreso)
router.use('/games', gameRoutes);

// Rutas de usuarios (preferencias)
router.use('/users', preferencesRoutes);

module.exports = router;
