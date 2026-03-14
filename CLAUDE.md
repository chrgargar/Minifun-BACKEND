# MINIFUN Backend - CLAUDE.md

## Descripcion del Proyecto

Backend API REST para la aplicacion movil MINIFUN, una coleccion de minijuegos educativos. Proporciona autenticacion de usuarios, gestion de perfiles, verificacion de email y panel de administracion.

## Stack Tecnologico

- **Runtime:** Node.js >= 16
- **Framework:** Express 4.x
- **Base de Datos:** MySQL con Sequelize ORM
- **Autenticacion:** JWT (jsonwebtoken)
- **Email:** Resend API
- **Logging:** Winston + Morgan
- **Seguridad:** Helmet, CORS, express-rate-limit, bcryptjs

## Estructura del Proyecto

```
Minifun-BACKEND/
├── server.js                    # Punto de entrada principal
├── package.json
├── .env.example                 # Variables de entorno de ejemplo
└── src/
    ├── app.js                   # Configuracion de Express y middlewares
    ├── config/
    │   ├── database.js          # Configuracion de Sequelize/MySQL
    │   ├── jwt.js               # Configuracion de JWT
    │   ├── logger.js            # Configuracion de Winston
    │   └── validateConfig.js    # Validacion de env vars requeridas
    ├── controllers/
    │   ├── authController.js    # Logica de autenticacion
    │   ├── adminController.js   # Panel de administracion
    │   └── logsController.js    # Gestion de logs
    ├── middlewares/
    │   ├── authMiddleware.js    # Verificacion de JWT
    │   ├── errorHandler.js      # Manejo global de errores
    │   ├── rateLimiter.js       # Rate limiting
    │   └── validators.js        # Validacion de inputs
    ├── models/
    │   ├── index.js             # Sincronizacion de modelos
    │   └── User.js              # Modelo de usuario
    ├── routes/
    │   ├── index.js             # Router principal
    │   ├── authRoutes.js        # Rutas de autenticacion
    │   ├── logsRoutes.js        # Rutas de logs
    │   ├── adminRoutes.js       # Rutas de admin (web)
    │   └── adminApiRoutes.js    # API de admin (JSON)
    ├── services/
    │   ├── authService.js       # Logica de negocio de auth
    │   ├── emailService.js      # Envio de emails con Resend
    │   └── fileLogService.js    # Logs persistentes
    ├── templates/
    │   ├── verificationEmail.js       # Template verificacion
    │   ├── passwordResetEmail.js      # Template reset password
    │   └── emailChangeVerification.js # Template cambio email
    ├── responses/
    │   └── apiResponse.js       # Formato estandar de respuestas
    └── public/
        ├── css/                 # Estilos del panel admin
        ├── js/                  # Scripts del panel admin
        └── pages/               # HTML del panel admin y emails
```

## Endpoints Principales

### Autenticacion (`/api/auth`)
- `POST /register` - Registro de usuario
- `POST /login` - Inicio de sesion
- `GET /me` - Obtener usuario actual (auth requerida)
- `POST /logout` - Cerrar sesion
- `POST /forgot-password` - Solicitar reset de password
- `POST /refresh-token` - Renovar access token
- `PATCH /profile` - Actualizar perfil (auth requerida)
- `PUT /avatar` - Actualizar avatar en Base64 (auth requerida)
- `DELETE /avatar` - Eliminar avatar (auth requerida)

### Sistema
- `GET /api/health` - Health check del servidor
- `POST /api/logs` - Recibir logs del cliente

### Admin
- `GET /admin/logs` - Panel web de administracion
- `GET /api/admin/logs` - API de logs (JSON)

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Produccion
npm start
```

## Variables de Entorno Requeridas

```env
NODE_ENV=development|production
PORT=3000
DB_HOST=localhost
DB_NAME=minifun
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
RESEND_API_KEY=re_...
EMAIL_FROM="MINIFUN <onboarding@resend.dev>"
FRONTEND_URL=http://localhost:3000
```

## Convenciones de Codigo

### Estructura de Respuestas API
```javascript
// Exito
{ success: true, message: "...", data: {...} }

// Error
{ success: false, message: "...", errors: [...] }
```

### Manejo de Errores
- Usar `throw` con Error y dejar que `errorHandler` lo procese
- Codigos HTTP apropiados (400, 401, 403, 404, 500)
- Mensajes en espanol para el usuario final

### Autenticacion
- JWT en header: `Authorization: Bearer <token>`
- Tokens con expiracion configurable
- Refresh tokens para renovacion

### Base de Datos
- Modelos Sequelize con timestamps automaticos
- Soft deletes cuando sea necesario
- Indices en campos de busqueda frecuente

## Patrones Importantes

1. **Validacion:** Siempre validar inputs en `validators.js` antes del controller
2. **Logging:** Usar `logger` de Winston, no `console.log`
3. **Errores:** Propagar errores al middleware `errorHandler`
4. **Seguridad:** Rate limiting en endpoints sensibles (login, register)
5. **Email:** Templates HTML en `src/templates/`, envio async

## Despliegue

- **Produccion actual:** Render.com
- **URL:** https://backend-minifun.onrender.com
- **Base de datos:** MySQL externo (configurar en env vars)

## Testing

Actualmente sin tests automatizados. Para testing manual:
```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'
```
