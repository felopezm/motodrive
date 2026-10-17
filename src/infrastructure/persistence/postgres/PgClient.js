const { ConflictError, ValidationError } = require('../../../domain/shared/errors');

/**
 * Traducción de errores de PostgreSQL a errores de dominio.
 * Para soportar un código nuevo basta con agregar una entrada (Abierto/Cerrado).
 */
const TRADUCCIONES = {
  23505: () => new ConflictError('Ya existe un registro con ese valor único'),
  23503: () => new ConflictError('Violación de integridad referencial: el registro relacionado no existe o tiene dependencias'),
  23514: () => new ValidationError({}, 'Un valor no cumple las restricciones de la base de datos'),
  '22P02': () => new ValidationError({}, 'Valor con formato inválido'),
  22003: () => new ValidationError({}, 'Valor numérico fuera de rango'),
  22007: () => new ValidationError({}, 'Fecha u hora con formato inválido'),
  22008: () => new ValidationError({}, 'Fecha u hora fuera de rango'),
};

/**
 * Envoltorio del pool de `pg`: único punto de acceso SQL de los adaptadores.
 * Aísla al resto de la aplicación de los códigos de error del motor.
 */
class PgClient {
  constructor(pool) {
    this.pool = pool;
  }

  async query(text, params = []) {
    try {
      return await this.pool.query(text, params);
    } catch (err) {
      const traducir = TRADUCCIONES[err.code];
      throw traducir ? traducir(err) : err;
    }
  }

  async uno(text, params) {
    const { rows } = await this.query(text, params);
    return rows[0] || null;
  }

  async varios(text, params) {
    const { rows } = await this.query(text, params);
    return rows;
  }

  cerrar() {
    return this.pool.end();
  }
}

module.exports = PgClient;
