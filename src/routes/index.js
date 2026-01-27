const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

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

// Agregar aquí futuras rutas (scores, profiles, etc.)

module.exports = router;
