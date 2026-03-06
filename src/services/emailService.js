const { Resend } = require('resend');
const logger = require('../config/logger');
const { getVerificationEmailTemplate } = require('../templates/verificationEmail');
const { getPasswordResetEmailTemplate, getPasswordResetPlainText } = require('../templates/passwordResetEmail');
const { getEmailChangeVerificationTemplate, getEmailChangePlainText } = require('../templates/emailChangeVerification');

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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/api/auth/verify-email/${verificationToken}`;

    const htmlContent = getVerificationEmailTemplate(user.username, verificationUrl);
    const textContent = this._generatePlainTextVersion(user.username, verificationUrl);

    return this._sendEmail({
      to: user.email,
      subject: '✓ Verifica tu cuenta de MINIFUN',
      html: htmlContent,
      text: textContent,
      logContext: 'verificación',
      userId: user.id,
    });
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
   * Método privado centralizado para enviar emails
   * Evita duplicación de código entre los diferentes tipos de email
   *
   * @param {Object} params - Parámetros del email
   * @param {string} params.to - Destinatario
   * @param {string} params.subject - Asunto del email
   * @param {string} params.html - Contenido HTML
   * @param {string} params.text - Contenido en texto plano
   * @param {string} params.logContext - Contexto para logging (ej: "verificación", "reset")
   * @param {string} params.userId - ID del usuario para logging
   * @returns {Promise<boolean>} true si el email se envió correctamente
   */
  async _sendEmail({ to, subject, html, text, logContext, userId }) {
    if (!this.isConfigured) {
      logger.warn(`No se pudo enviar email de ${logContext} a ${to}: Servicio no configurado`);
      return false;
    }

    try {
      const response = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'MINIFUN <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      });

      if (response.data && response.data.id) {
        logger.info(`✅ Email de ${logContext} enviado a ${to}`, {
          emailId: response.data.id,
          userId,
        });
        return true;
      } else {
        logger.error(`❌ Error al enviar email de ${logContext} a ${to}:`, response.error);
        return false;
      }
    } catch (error) {
      logger.error(`❌ Error al enviar email de ${logContext} a ${to}:`, error);
      return false;
    }
  }

  /**
   * Envía el email de verificación cuando el usuario cambia su email
   */
  async sendEmailChangeVerification(user, verificationToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/api/auth/verify-email/${verificationToken}`;

    const htmlContent = getEmailChangeVerificationTemplate(user.username, verificationUrl);
    const textContent = getEmailChangePlainText(user.username, verificationUrl);

    return this._sendEmail({
      to: user.email,
      subject: '📧 Verifica tu nuevo email - MINIFUN',
      html: htmlContent,
      text: textContent,
      logContext: 'cambio de correo',
      userId: user.id,
    });
  }

  /**
   * Envía un email de restablecimiento de contraseña
   *
   * @param {Object} user - Usuario al que se enviará el email
   * @param {string} user.email - Email del usuario
   * @param {string} user.username - Nombre de usuario
   * @param {string} user.id - ID del usuario
   * @param {string} resetToken - Token de restablecimiento
   * @returns {Promise<boolean>} true si el email se envió correctamente
   */
  async sendPasswordResetEmail(user, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/api/auth/reset-password/${resetToken}`;

    const htmlContent = getPasswordResetEmailTemplate(user.username, resetUrl);
    const textContent = getPasswordResetPlainText(user.username, resetUrl);

    return this._sendEmail({
      to: user.email,
      subject: '🔐 Recupera tu contraseña de MINIFUN',
      html: htmlContent,
      text: textContent,
      logContext: 'reset de contraseña',
      userId: user.id,
    });
  }
}

// Crear instancia única del servicio (Singleton)
const emailService = new EmailService();

module.exports = emailService;
