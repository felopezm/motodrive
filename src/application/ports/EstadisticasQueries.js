/** Puerto de LECTURA para las métricas del dashboard. */
class EstadisticasQueries {
  /**
   * @returns {Promise<{ resumen: object, porMarca: object[], porColor: object[], recientes: object[] }>}
   */
  async obtener() { throw new Error('EstadisticasQueries.obtener no implementado'); }
}

module.exports = EstadisticasQueries;
