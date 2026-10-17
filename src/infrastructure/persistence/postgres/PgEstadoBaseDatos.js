const EstadoBaseDatos = require('../../../application/ports/EstadoBaseDatos');

/** Adaptador PostgreSQL para verificar la conexión con la base de datos. */
class PgEstadoBaseDatos extends EstadoBaseDatos {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  async verificar() {
    const fila = await this.db.uno('SELECT NOW() AS hora, version() AS version');
    return { hora: fila.hora, version: fila.version };
  }
}

module.exports = PgEstadoBaseDatos;
