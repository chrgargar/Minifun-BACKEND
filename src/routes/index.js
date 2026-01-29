const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');

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

// Rutas de administración (temporal - eliminar en producción)
router.use('/admin', adminRoutes);

// Agregar aquí futuras rutas (scores, profiles, etc.)

module.exports = router;
