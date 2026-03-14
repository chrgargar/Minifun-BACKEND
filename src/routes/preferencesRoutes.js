const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const preferencesController = require('../controllers/preferencesController');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/users/:userId/preferences - Obtener preferencias
router.get('/:userId/preferences', preferencesController.getPreferences);

// PUT /api/users/:userId/preferences - Guardar preferencias completas
router.put('/:userId/preferences', preferencesController.savePreferences);

// PATCH /api/users/:userId/preferences - Actualizar campo específico
router.patch('/:userId/preferences', preferencesController.updatePreference);

module.exports = router;
