const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// Ruta para que el frontend envíe logs (requiere autenticación)
router.post('/', authenticateToken, logsController.receiveLogs);

// Rutas de admin (requieren autenticación + rol admin)
router.get('/admin/users', authenticateToken, isAdmin, logsController.getUsersWithLogs);
router.get('/admin/:userId', authenticateToken, isAdmin, logsController.listUserLogs);
router.get('/admin/:userId/:date', authenticateToken, isAdmin, logsController.readUserLog);
router.get('/admin/:userId/:date/download', authenticateToken, isAdmin, logsController.downloadLog);
router.delete('/admin/cleanup', authenticateToken, isAdmin, logsController.cleanupOldLogs);

module.exports = router;
