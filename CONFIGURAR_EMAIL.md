# 📧 Configuración de Gmail para Verificación de Email

Esta guía te ayudará a configurar Gmail para enviar emails de verificación desde el backend de MINIFUN.

---

## 📋 Requisitos

- Una cuenta de Gmail
- Verificación en 2 pasos activada en tu cuenta de Google

---

## 🔧 Paso 1: Activar Verificación en 2 Pasos

1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. En la sección "Cómo accedes a Google", haz clic en **"Verificación en 2 pasos"**
3. Sigue los pasos para activarla (si no está activada)

---

## 🔑 Paso 2: Generar App Password

Una **App Password** es una contraseña de 16 caracteres que permite que aplicaciones externas (como nuestro backend) accedan a tu cuenta de Gmail de forma segura, sin usar tu contraseña real.

### Instrucciones:

1. Ve a [Google App Passwords](https://myaccount.google.com/apppasswords)
   - O desde: Google Account > Security > 2-Step Verification > App passwords

2. En "Select app", elige **"Mail"** o **"Other (Custom name)"**
   - Si eliges "Other", pon un nombre como `MINIFUN Backend`

3. En "Select device", elige **"Other (Custom name)"**
   - Pon: `MINIFUN Backend Server`

4. Haz clic en **"Generate"**

5. Google te mostrará una contraseña de 16 caracteres como:
   ```
   abcd efgh ijkl mnop
   ```

6. **¡COPIA ESTA CONTRASEÑA!** (la usarás en el siguiente paso)
   - No podrás volver a verla
   - Si la pierdes, deberás generar una nueva

---

## ⚙️ Paso 3: Configurar Variables de Entorno

1. **Abre el archivo `.env`** en la raíz del proyecto backend:
   ```
   C:\Users\chrgargar4\Desktop\minifun-backend\.env
   ```

2. **Agrega o actualiza estas variables:**
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu-correo@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   EMAIL_FROM="MINIFUN" <tu-correo@gmail.com>
   FRONTEND_URL=https://backend-minifun.onrender.com
   ```

3. **Reemplaza:**
   - `tu-correo@gmail.com` → Tu dirección de Gmail real
   - `abcd efgh ijkl mnop` → La App Password que generaste (puedes poner los espacios o quitarlos, ambos funcionan)
   - `FRONTEND_URL` → La URL donde los usuarios harán clic para verificar su email

---

## 🌐 Paso 4: Configurar FRONTEND_URL

La variable `FRONTEND_URL` es la URL base donde los usuarios serán redirigidos al hacer clic en el enlace de verificación.

### Opciones:

#### A) Desarrollo Local (Para probar en tu computadora)
```env
FRONTEND_URL=http://localhost:3000
```

#### B) Producción (Backend en Render)
```env
FRONTEND_URL=https://backend-minifun.onrender.com
```

**Nota:** Por ahora, el enlace apuntará a tu backend. En el futuro, cuando tengas un frontend web, deberás cambiar esta URL.

---

## 🚀 Paso 5: Desplegar a Render

Si estás usando Render para el backend en producción:

1. Ve a tu proyecto en [Render Dashboard](https://dashboard.render.com/)

2. En **Environment**, agrega estas variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu-correo@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   EMAIL_FROM="MINIFUN" <tu-correo@gmail.com>
   FRONTEND_URL=https://backend-minifun.onrender.com
   ```

3. Guarda los cambios y **redeploy** el backend

---

## 📧 Paso 6: Probar el Envío de Emails

### Desde el Backend Local:

1. **Inicia el servidor:**
   ```bash
   cd C:\Users\chrgargar4\Desktop\minifun-backend
   npm start
   ```

2. **Registra un usuario con email:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "tu-email-prueba@gmail.com",
       "password": "password123"
     }'
   ```

3. **Revisa tu bandeja de entrada** (o spam) y busca el email de verificación

### Desde la App Flutter:

1. Cambia `isDevelopment` a `true` en [api_constants.dart](c:\Users\chrgargar4\Desktop\minifun\lib\constants\api_constants.dart)

2. Ejecuta la app y regístrate con un email real

3. Revisa tu bandeja de entrada para el email de verificación

---

## 🔍 Verificar que Funciona

Si todo está configurado correctamente, verás estos logs al iniciar el servidor:

```
[INFO] Inicializando servicio de email...
[INFO] Servicio de email configurado correctamente
[INFO] Conexión con servidor SMTP verificada exitosamente
```

Si hay problemas, verás warnings como:

```
[WARN] Configuración de email no encontrada. El envío de emails está deshabilitado.
```

---

## ✅ Endpoints Disponibles

Una vez configurado, estos son los endpoints relacionados con email:

### 1. Registrar usuario (envía email automáticamente si se proporciona email)
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

### 1. "Error: Invalid login"
**Causa:** Contraseña incorrecta o no usaste App Password

**Solución:**
- Asegúrate de usar la **App Password** (16 caracteres), no tu contraseña normal de Gmail
- Verifica que la verificación en 2 pasos esté activada

### 2. Los emails van a spam
**Causa:** Gmail detecta el email como spam porque viene de un servidor no verificado

**Solución:**
- Marca el email como "No es spam" en Gmail
- Para producción, considera usar un servicio profesional como SendGrid o Resend
- Configura SPF y DKIM (avanzado)

### 3. "Connection timeout"
**Causa:** Firewall bloqueando el puerto 587

**Solución:**
- Verifica que el puerto 587 esté abierto
- Intenta cambiar `EMAIL_PORT=465` (SSL)
- Si usas Render, verifica que las variables de entorno estén correctas

### 4. No se envían emails pero no hay error
**Causa:** Variables de entorno no configuradas

**Solución:**
- Verifica que `EMAIL_USER` y `EMAIL_PASSWORD` estén en `.env`
- Reinicia el servidor después de cambiar `.env`
- Revisa los logs del servidor para ver warnings

---

## 📝 Notas Importantes

### Seguridad
- **NUNCA subas el archivo `.env` a GitHub** (ya está en `.gitignore`)
- La App Password es sensible, protégela como una contraseña
- Usa una cuenta de Gmail específica para la app (no tu cuenta personal)

### Límites de Gmail
- **500 emails por día** en cuentas gratuitas
- Gmail puede bloquear temporalmente el envío si detecta spam

### Alternativas Recomendadas para Producción
- **Resend** - 100 emails/día gratis, mejor deliverability
- **SendGrid** - 100 emails/día gratis, muy usado
- **AWS SES** - Muy barato, requiere configuración más compleja

---

## 🎯 Próximos Pasos

Una vez configurado el email:

1. ✅ Registra usuarios desde la app Flutter
2. ✅ Verifica que reciban el email
3. ✅ Implementa la pantalla de verificación en Flutter (opcional)
4. 🔜 Agregar recordatorio si el usuario no verifica su email
5. 🔜 Agregar funcionalidad de "Recuperar contraseña" por email

---

## 📧 Contacto

Si tienes problemas con la configuración, revisa los logs del servidor para ver los errores específicos.

**Logs importantes:**
- `[INFO] Servicio de email configurado correctamente` ✅
- `[WARN] Configuración de email no encontrada` ❌
- `[ERROR] Error al enviar email de verificación` ❌
