const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// Ruta para que el frontend envíe logs (requiere autenticación)
router.post('/', authenticateToken, logsController.receiveLogs);

// Rutas de admin (requieren autenticación + rol admin)
router.get('/admin/users', authenticateToken, isAdmin, logsController.getUsersWithLogStats);
router.get('/admin/:userId', authenticateToken, isAdmin, logsController.getUserLogs);
router.delete('/admin/cleanup', authenticateToken, isAdmin, logsController.cleanupOldLogs);

module.exports = router;
