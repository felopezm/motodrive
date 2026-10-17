/** Configuración leída de variables de entorno (12-factor), con valores por defecto. */
function cargarEntorno(env = process.env) {
  return Object.freeze({
    entorno: env.NODE_ENV || 'development',
    puerto: Number(env.PORT || 3000),
    baseDatos: Object.freeze({
      host: env.DB_HOST || 'localhost',
      port: Number(env.DB_PORT || 5432),
      database: env.DB_NAME || 'motodrive',
      user: env.DB_USER || 'motodrive',
      password: env.DB_PASSWORD || 'motodrive_secret',
      max: Number(env.DB_POOL_MAX || 10),
    }),
  });
}

module.exports = cargarEntorno;
