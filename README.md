# MINIFUN Backend

Backend Node.js con Express para la aplicación de minijuegos educativos MINIFUN.

## Características

- Autenticación con JWT
- Hash de contraseñas con bcryptjs
- Base de datos MySQL con Sequelize ORM
- Validaciones robustas
- Manejo centralizado de errores
- Arquitectura modular y escalable

## Requisitos

- Node.js >= 16.0.0
- MySQL >= 5.7
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crear base de datos MySQL:
```sql
CREATE DATABASE minifun CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de MySQL
```

4. Iniciar servidor:
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## Endpoints

### Base URL: `http://localhost:3000/api`

#### POST /auth/register
Registro de nuevo usuario.

**Request Body:**
```json
{
  "username": "ejemplo123",
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "ejemplo123",
      "email": "usuario@example.com",
      "is_premium": false,
      "created_at": "2026-01-26T10:00:00.000Z",
      "last_login": "2026-01-26T10:00:00.000Z",
      "streak_days": 0
    }
  }
}
```

#### POST /auth/login
Iniciar sesión con username/email y contraseña.

**Request Body:**
```json
{
  "usernameOrEmail": "ejemplo123",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { /* datos del usuario */ }
  }
}
```

#### GET /auth/me
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": { /* datos del usuario */ }
  }
}
```

#### POST /auth/logout
Cerrar sesión.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

#### GET /health
Verificar estado del servidor.

**Response (200):**
```json
{
  "success": true,
  "message": "MINIFUN Backend funcionando correctamente",
  "timestamp": "2026-01-26T10:00:00.000Z"
}
```

## Pruebas con cURL

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"testuser","password":"password123"}'
```

### Obtener usuario autenticado
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Estructura del Proyecto

```
minifun-backend/
├── src/
│   ├── config/           # Configuraciones (database, jwt)
│   ├── models/           # Modelos Sequelize (User)
│   ├── controllers/      # Lógica de negocio (authController)
│   ├── middlewares/      # Auth JWT, validadores, errorHandler
│   ├── routes/           # Rutas Express (authRoutes)
│   ├── utils/            # Utilidades (responseUtils, passwordUtils)
│   └── app.js           # Configuración Express
├── .env                 # Variables de entorno
├── .env.example         # Plantilla de variables
├── .gitignore
├── package.json
├── server.js            # Punto de entrada
└── README.md
```

## Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

Variables principales:
- `NODE_ENV`: Entorno de ejecución (development/production)
- `PORT`: Puerto del servidor (default: 3000)
- `DB_HOST`: Host de MySQL (default: localhost)
- `DB_NAME`: Nombre de la base de datos
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `JWT_SECRET`: Clave secreta para JWT
- `JWT_EXPIRES_IN`: Tiempo de expiración del token (default: 7d)

## Seguridad

- Contraseñas hasheadas con bcryptjs (10 rounds)
- Autenticación JWT
- Headers de seguridad con helmet
- CORS configurado
- Validaciones en múltiples capas
- Protección contra SQL injection (Sequelize ORM)

## Licencia

ISC
