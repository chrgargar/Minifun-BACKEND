require('dotenv').config();

/**
 * Valida que todas las variables de entorno necesarias estén presentes
 *
 * Este módulo se ejecuta al inicio del servidor para asegurar que
 * todas las configuraciones críticas están disponibles, evitando
 * errores en tiempo de ejecución.
 */

const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
];

const optionalEnvVars = {
  'NODE_ENV': 'development',
  'PORT': '3000',
  'DB_PASSWORD': '',
  'JWT_EXPIRES_IN': '7d',
  'CORS_ORIGIN': '*',
};

/**
 * Valida la configuración del entorno
 *
 * @throws {Error} Si falta alguna variable requerida o tiene valor inválido
 */
function validateConfig() {
  const missing = [];
  const warnings = [];

  // Verificar variables requeridas
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Faltan variables de entorno requeridas: ${missing.join(', ')}\n` +
      `   Por favor, configura estas variables en el archivo .env`
    );
  }

  // Establecer valores por defecto para variables opcionales
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`⚠️  ${varName} no configurado, usando valor por defecto: "${defaultValue}"`);
    }
  }

  // Validaciones específicas
  validateJwtSecret();
  validatePort();
  validateNodeEnv();

  // Mostrar advertencias si las hay
  if (warnings.length > 0) {
    console.log('\n⚠️  Advertencias de configuración:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  console.log('✅ Configuración validada correctamente\n');
}

/**
 * Valida que JWT_SECRET sea suficientemente seguro
 *
 * En producción, el secreto debe ser largo y aleatorio para prevenir
 * ataques de fuerza bruta
 */
function validateJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && secret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error(
      '❌ JWT_SECRET por defecto detectado en producción.\n' +
      '   Por seguridad, debes configurar un secreto único y aleatorio.'
    );
  }

  if (secret.length < 32) {
    console.warn('⚠️  JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }
}

/**
 * Valida que el puerto sea un número válido
 */
function validatePort() {
  const port = parseInt(process.env.PORT);

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`❌ PORT inválido: ${process.env.PORT}. Debe ser un número entre 1 y 65535.`);
  }
}

/**
 * Valida el entorno de ejecución
 */
function validateNodeEnv() {
  const validEnvs = ['development', 'production', 'test'];
  const env = process.env.NODE_ENV;

  if (!validEnvs.includes(env)) {
    console.warn(`⚠️  NODE_ENV="${env}" no es reconocido. Valores válidos: ${validEnvs.join(', ')}`);
  }

  if (env === 'production') {
    console.log('🚀 Ejecutando en modo PRODUCCIÓN');
  } else {
    console.log(`🔧 Ejecutando en modo ${env.toUpperCase()}`);
  }
}

module.exports = { validateConfig };
