const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const gameController = require('../controllers/gameController');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/games/progress - Obtener todos los progresos
router.get('/progress', gameController.getAllProgress);

// POST /api/games/progress - Guardar/actualizar progreso
router.post('/progress', gameController.saveProgress);

// GET /api/games/progress/:gameType - Obtener progreso de un juego
router.get('/progress/:gameType', gameController.getProgressByType);

// DELETE /api/games/progress/:gameType - Eliminar progreso
router.delete('/progress/:gameType', gameController.deleteProgress);

module.exports = router;
