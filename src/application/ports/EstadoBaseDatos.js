/** Puerto para consultar la disponibilidad del almacenamiento persistente. */
class EstadoBaseDatos {
  /** @returns {Promise<{ hora: Date, version: string }>} lanza si no hay conexión */
  async verificar() { throw new Error('EstadoBaseDatos.verificar no implementado'); }
}

module.exports = EstadoBaseDatos;
