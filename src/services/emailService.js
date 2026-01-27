const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const { getVerificationEmailTemplate } = require('../templates/verificationEmail');

/**
 * Servicio de envío de emails usando Gmail y Nodemailer
 *
 * Configuración requerida en .env:
 * - EMAIL_HOST: smtp.gmail.com
 * - EMAIL_PORT: 587
 * - EMAIL_USER: tu-correo@gmail.com
 * - EMAIL_PASSWORD: tu-app-password (no la contraseña normal)
 * - EMAIL_FROM: "MINIFUN <tu-correo@gmail.com>"
 * - FRONTEND_URL: URL del frontend para los enlaces (ej: http://localhost:3000)
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  /**
   * Inicializa el transportador de Nodemailer con las credenciales de Gmail
   */
  initialize() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      logger.warn('Configuración de email no encontrada. El envío de emails está deshabilitado.');
      logger.warn('Para habilitar emails, configura EMAIL_USER y EMAIL_PASSWORD en .env');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.isConfigured = true;
      logger.info('Servicio de email configurado correctamente');
    } catch (error) {
      logger.error('Error al configurar el servicio de email:', error);
    }
  }

  /**
   * Verifica la conexión con el servidor SMTP
   * @returns {Promise<boolean>} true si la conexión es exitosa
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Conexión con servidor SMTP verificada exitosamente');
      return true;
    } catch (error) {
      logger.error('Error al verificar conexión con servidor SMTP:', error);
      return false;
    }
  }

  /**
   * Envía el email de verificación de cuenta
   *
   * @param {Object} user - Usuario al que se enviará el email
   * @param {string} user.email - Email del usuario
   * @param {string} user.username - Nombre de usuario
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
      const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      const htmlContent = getVerificationEmailTemplate(user.username, verificationUrl);

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"MINIFUN" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '✓ Verifica tu cuenta de MINIFUN',
        html: htmlContent,
        text: this._generatePlainTextVersion(user.username, verificationUrl),
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email de verificación enviado a ${user.email}`, {
        messageId: info.messageId,
        userId: user.id,
      });

      return true;
    } catch (error) {
      logger.error(`Error al enviar email de verificación a ${user.email}:`, error);
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
