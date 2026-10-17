const { Pool, types } = require('pg');

// DATE (OID 1082) → 'YYYY-MM-DD' tal cual, sin conversión de zona horaria
types.setTypeParser(1082, (value) => value);
// NUMERIC (OID 1700) → número JS (los precios caben sin pérdida en un double)
types.setTypeParser(1700, (value) => (value === null ? null : Number(value)));

function crearPool(config) {
  const pool = new Pool({ ...config, idleTimeoutMillis: 30000 });
  pool.on('error', (err) => console.error('[db] Error inesperado en el pool:', err.message));
  return pool;
}

/** Reintenta hasta que PostgreSQL acepte conexiones (útil al arrancar contenedores). */
async function esperarConexion(pool, { intentos = 20, esperaMs = 2000 } = {}) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[db] Conexión con PostgreSQL establecida');
      return;
    } catch (err) {
      console.warn(`[db] Intento ${i}/${intentos} fallido: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
    }
  }
  throw new Error('No fue posible conectar con la base de datos');
}

module.exports = { crearPool, esperarConexion };
