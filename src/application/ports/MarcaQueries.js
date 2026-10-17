/* eslint-disable no-unused-vars */
/** Puerto de LECTURA de marcas: vistas con métricas agregadas de su inventario. */
class MarcaQueries {
  /** @returns {Promise<object[]>} */
  async listar() { throw new Error('MarcaQueries.listar no implementado'); }

  /** @returns {Promise<object|null>} */
  async detalle(id) { throw new Error('MarcaQueries.detalle no implementado'); }
}

module.exports = MarcaQueries;
