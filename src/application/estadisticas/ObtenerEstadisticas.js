/** Caso de uso: obtener los indicadores del dashboard de inventario. */
class ObtenerEstadisticas {
  constructor({ estadisticasQueries }) {
    this.queries = estadisticasQueries;
  }

  async ejecutar() {
    const { resumen, porMarca, porColor, recientes } = await this.queries.obtener();
    return {
      ...resumen,
      porcentajeAseguradas: resumen.total ? Math.round((resumen.aseguradas / resumen.total) * 100) : 0,
      porMarca,
      porColor,
      recientes,
    };
  }
}

module.exports = ObtenerEstadisticas;
