const { Resend } = require('resend');
const logger = require('../config/logger');
const { getVerificationEmailTemplate } = require('../templates/verificationEmail');

/**
 * Servicio de envío de emails usando Resend
 *
 * Resend es un servicio de envío de emails profesional que usa HTTP API
 * en lugar de SMTP, lo que lo hace compatible con Render y otros hostings
 * que bloquean puertos SMTP.
 *
 * Configuración requerida en .env:
 * - RESEND_API_KEY: Tu API key de Resend (empieza con re_...)
 * - EMAIL_FROM: "MINIFUN <noreply@resend.dev>" o tu dominio verificado
 * - FRONTEND_URL: URL del frontend para los enlaces (ej: https://backend-minifun.onrender.com)
 *
 * Ventajas sobre SMTP:
 * - No requiere puertos SMTP (funciona en Render, Vercel, Netlify, etc.)
 * - Mejor deliverability (menos probabilidad de ir a spam)
 * - API más simple y moderna
 * - 100 emails/día gratis
 */
class EmailService {
  constructor() {
    this.resend = null;
    this.isConfigured = false;
  }

  /**
   * Inicializa el cliente de Resend con la API Key
   */
  initialize() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      logger.warn('RESEND_API_KEY no encontrada. El envío de emails está deshabilitado.');
      logger.warn('Para habilitar emails:');
      logger.warn('1. Ve a resend.com y crea una cuenta');
      logger.warn('2. Obtén tu API Key');
      logger.warn('3. Configura RESEND_API_KEY en .env');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
      logger.info('✅ Servicio de email configurado correctamente con Resend');
    } catch (error) {
      logger.error('❌ Error al configurar el servicio de email:', error);
    }
  }

  /**
   * Verifica que el servicio esté configurado
   * @returns {Promise<boolean>} true si está configurado
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      logger.warn('Servicio de email no configurado');
      return false;
    }

    // Resend no tiene un método de "verify" como SMTP
    // Simplemente verificamos que esté inicializado
    logger.info('✅ Servicio de email con Resend está listo');
    return true;
  }

  /**
   * Envía el email de verificación de cuenta
   *
   * @param {Object} user - Usuario al que se enviará el email
   * @param {string} user.email - Email del usuario
   * @param {string} user.username - Nombre de usuario
   * @param {string} user.id - ID del usuario
   * @param {string} verificationToken - Token de verificación único
   * @returns {Promise<boolean>} true si el email se envió correctamente
   */
  async sendVerificationEmail(user, verificationToken) {
    if (!this.isConfigured) {
      logger.warn(`No se pudo enviar email de verificación a ${user.email}: Servicio no configurado`);
      return false;
    }

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/api/auth/verify-email/${verificationToken}`;

      const htmlContent = getVerificationEmailTemplate(user.username, verificationUrl);
      const textContent = this._generatePlainTextVersion(user.username, verificationUrl);

      // Enviar email con Resend
      const response = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'MINIFUN <onboarding@resend.dev>',
        to: [user.email],
        subject: '✓ Verifica tu cuenta de MINIFUN',
        html: htmlContent,
        text: textContent,
      });

      // Resend retorna un objeto con id si fue exitoso
      if (response.data && response.data.id) {
        logger.info(`✅ Email de verificación enviado a ${user.email}`, {
          emailId: response.data.id,
          userId: user.id,
        });
        return true;
      } else {
        logger.error(`❌ Error al enviar email a ${user.email}:`, response.error);
        return false;
      }
    } catch (error) {
      logger.error(`❌ Error al enviar email de verificación a ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Genera una versión de texto plano del email de verificación
   * (para clientes de correo que no soportan HTML)
   *
   * @param {string} username - Nombre del usuario
   * @param {string} verificationUrl - URL de verificación
   * @returns {string} Versión en texto plano
   */
  _generatePlainTextVersion(username, verificationUrl) {
    return `
Hola, ${username}!

Bienvenido a MINIFUN! Estamos emocionados de tenerte con nosotros.

Para completar tu registro y comenzar a disfrutar de nuestros minijuegos educativos,
necesitamos verificar tu dirección de correo electrónico.

Verifica tu cuenta haciendo clic en el siguiente enlace:
${verificationUrl}

IMPORTANTE: Este enlace expirará en 24 horas.

Si no creaste una cuenta en MINIFUN, puedes ignorar este correo de forma segura.

© ${new Date().getFullYear()} MINIFUN - Todos los derechos reservados
    `.trim();
  }

  /**
   * Envía un email de restablecimiento de contraseña (para futuro uso)
   *
   * @param {Object} user - Usuario al que se enviará el email
   * @param {string} resetToken - Token de restablecimiento
   * @returns {Promise<boolean>} true si el email se envió correctamente
   */
  async sendPasswordResetEmail(user, resetToken) {
    // TODO: Implementar cuando se añada funcionalidad de reset de contraseña
    logger.info(`Funcionalidad de reset de contraseña pendiente de implementar para ${user.email}`);
    return false;
  }
}

// Crear instancia única del servicio (Singleton)
const emailService = new EmailService();

module.exports = emailService;
