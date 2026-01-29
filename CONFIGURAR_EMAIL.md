# 📧 Configuración de Resend para Verificación de Email

Esta guía te ayudará a configurar Resend para enviar emails de verificación desde el backend de MINIFUN.

**¿Por qué Resend en lugar de Gmail?**
- ✅ Funciona en Render (no usa SMTP bloqueado)
- ✅ Configuración más simple (solo 1 API Key)
- ✅ Mejor deliverability (no va a spam)
- ✅ 100 emails/día gratis
- ✅ No expones credenciales personales

---

## 🚀 Paso 1: Crear Cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Haz clic en **"Sign Up"**
3. Regístrate con tu email o GitHub
4. Verifica tu email si te lo piden

---

## 🔑 Paso 2: Obtener API Key

1. Una vez dentro del dashboard de Resend
2. En el menú izquierdo, haz clic en **"API Keys"**
3. Haz clic en **"Create API Key"**
4. Dale un nombre: `MINIFUN Backend`
5. Haz clic en **"Add"**
6. **COPIA la API Key** que te muestra (empieza con `re_...`)

**⚠️ MUY IMPORTANTE:**
- La API Key solo se muestra una vez
- Si la pierdes, tendrás que crear una nueva
- Guárdala en un lugar seguro

---

## ⚙️ Paso 3: Configurar Variables de Entorno Localmente

### Opción A: Si quieres probar localmente primero

1. Abre el archivo `.env` en la raíz del proyecto backend:
   ```
   C:\Users\chrgargar4\Desktop\minifun-backend\.env
   ```

2. Reemplaza `TU_API_KEY_AQUI` con tu API Key real:
   ```env
   RESEND_API_KEY=re_tu_api_key_real_aqui
   EMAIL_FROM="MINIFUN <onboarding@resend.dev>"
   FRONTEND_URL=http://localhost:3000
   ```

3. Guarda el archivo

4. Reinicia el servidor:
   ```bash
   npm start
   ```

5. Deberías ver en los logs:
   ```
   ✅ Servicio de email configurado correctamente con Resend
   ```

---

## 🌐 Paso 4: Configurar en Render (Producción)

**IMPORTANTE:** Debes hacer esto para que funcione en producción.

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio **backend-minifun**
3. Ve a la pestaña **"Environment"**
4. Agrega estas 3 variables:

   | Key | Value |
   |-----|-------|
   | `RESEND_API_KEY` | `re_tu_api_key_aqui` |
   | `EMAIL_FROM` | `"MINIFUN <onboarding@resend.dev>"` |
   | `FRONTEND_URL` | `https://backend-minifun.onrender.com` |

5. Haz clic en **"Save Changes"**
6. Render automáticamente redesplegará el backend

---

## 🧪 Paso 5: Probar el Envío de Emails

### Probar desde Postman o cURL:

```bash
curl -X POST https://backend-minifun.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "tu-email@gmail.com",
    "password": "password123"
  }'
```

### Probar desde la App Flutter:

1. Asegúrate de que `isDevelopment = false` en [api_constants.dart](c:\Users\chrgargar4\Desktop\minifun\lib\constants\api_constants.dart)
2. Ejecuta la app y regístrate con un email real
3. Revisa tu bandeja de entrada (puede tardar 1-2 minutos)
4. **Si no lo ves, revisa la carpeta de spam**

---

## ✅ Verificar que Funciona

### En los logs de Render:

```
✅ Servicio de email configurado correctamente con Resend
✅ Email de verificación enviado a usuario@example.com
```

### Si ves errores:

```
❌ RESEND_API_KEY no encontrada
```
→ Verifica que agregaste la variable en Render

```
❌ Error al enviar email de verificación
```
→ Revisa que la API Key sea correcta (empieza con `re_`)

---

## 📧 Endpoints Disponibles

Una vez configurado, estos son los endpoints relacionados con email:

### 1. Registrar usuario (envía email automáticamente)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario123",
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Usuario registrado. Verifica tu email para activar tu cuenta.",
  "data": {
    "token": "jwt-token...",
    "user": {
      "id": 1,
      "username": "usuario123",
      "email": "usuario@example.com",
      "email_verified": false,
      ...
    }
  }
}
```

### 2. Verificar email (desde el enlace del correo)
```http
GET /api/auth/verify-email/:token
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Email verificado exitosamente. ¡Tu cuenta está activada!",
  "data": {
    "user": {
      "id": 1,
      "email_verified": true
    }
  }
}
```

### 3. Reenviar email de verificación (requiere autenticación)
```http
POST /api/auth/resend-verification
Authorization: Bearer <jwt-token>
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Email de verificación enviado. Revisa tu bandeja de entrada."
}
```

---

## ❓ Problemas Comunes

### 1. "RESEND_API_KEY no encontrada"
**Solución:**
- Verifica que agregaste la variable en Render
- Asegúrate de que el nombre sea exactamente `RESEND_API_KEY`
- Guarda los cambios y espera a que Render redesplegue

### 2. Los emails van a spam
**Solución:**
- Marca el email como "No es spam" en Gmail
- En producción, considera verificar tu propio dominio en Resend
- Los emails desde `@resend.dev` pueden ir a spam inicialmente

### 3. "Error al enviar email de verificación"
**Solución:**
- Verifica que la API Key sea correcta
- Asegúrate de que no la copiaste con espacios extra
- Revisa que la API Key esté activa en Resend

### 4. El enlace no funciona
**Solución:**
- Verifica que `FRONTEND_URL` apunte a tu backend de Render
- Por ahora: `https://backend-minifun.onrender.com`
- Cuando tengas frontend web, cámbialo a tu dominio de frontend

---

## 🎯 Notas Importantes

### Seguridad
- **NUNCA subas el archivo `.env` a GitHub** (ya está en `.gitignore`)
- La API Key es sensible, protégela como una contraseña
- No compartas tu API Key en público

### Límites de Resend (Plan Gratuito)
- **100 emails por día**
- Suficiente para empezar y hacer pruebas
- Si necesitas más, Resend tiene planes de pago muy económicos

### Dominio Personalizado (Opcional - Futuro)
Por ahora usas `onboarding@resend.dev` (gratis).

Si quieres emails desde tu propio dominio (`noreply@minifun.com`):
1. Compra un dominio
2. Verifica el dominio en Resend
3. Cambia `EMAIL_FROM` a tu dominio

---

## 📝 Checklist Final

Antes de desplegar, asegúrate de:

- ✅ Creaste cuenta en Resend
- ✅ Obtuviste tu API Key
- ✅ Agregaste `RESEND_API_KEY` en Render
- ✅ Agregaste `EMAIL_FROM` en Render
- ✅ Agregaste `FRONTEND_URL` en Render
- ✅ Guardaste cambios en Render
- ✅ Esperaste a que Render redesplegara
- ✅ Probaste registrarte con un email real
- ✅ Verificaste que llegó el email

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs de Render (pestaña "Logs")
2. Busca mensajes que empiecen con `✅` o `❌`
3. Verifica que todas las variables de entorno estén correctas

---

## 🎉 ¡Listo!

Una vez configurado, cada vez que un usuario se registre con email, recibirá automáticamente un correo de verificación. El sistema está listo para producción.
