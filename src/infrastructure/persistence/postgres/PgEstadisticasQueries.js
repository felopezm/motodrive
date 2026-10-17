const EstadisticasQueries = require('../../../application/ports/EstadisticasQueries');

const SQL_RESUMEN = `
  SELECT COUNT(*)::int                                AS total,
         COALESCE(SUM(precio_venta), 0)::float        AS "valorTotal",
         COALESCE(AVG(precio_venta), 0)::float        AS "precioPromedio",
         COUNT(*) FILTER (WHERE esta_asegurada)::int  AS aseguradas,
         COALESCE(AVG(kilometraje), 0)::float         AS "kmPromedio",
         COALESCE(AVG(cilindrada_cc), 0)::float       AS "ccPromedio",
         COUNT(*) FILTER (WHERE fecha_ingreso >= CURRENT_DATE - INTERVAL '30 days')::int AS "ingresosRecientes",
         (SELECT COUNT(*)::int FROM marcas)           AS "totalMarcas"
    FROM motocicletas`;

const SQL_POR_MARCA = `
  SELECT ma.nombre, COUNT(m.id)::int AS cantidad, COALESCE(SUM(m.precio_venta), 0)::float AS valor
    FROM marcas ma LEFT JOIN motocicletas m ON m.marca_id = ma.id
   GROUP BY ma.id HAVING COUNT(m.id) > 0
   ORDER BY cantidad DESC, valor DESC`;

const SQL_POR_COLOR = `
  SELECT color_principal AS color, COUNT(*)::int AS cantidad
    FROM motocicletas GROUP BY color_principal ORDER BY cantidad DESC`;

const SQL_RECIENTES = `
  SELECT m.id, m.modelo, m.precio_venta AS "precioVenta", m.anio_fabricacion AS "anioFabricacion",
         m.creado_en AS "creadoEn", m.actualizado_en AS "actualizadoEn", m.color_principal AS "colorPrincipal",
         (m.fotografia IS NOT NULL) AS "tieneFoto", ma.nombre AS "marcaNombre"
    FROM motocicletas m JOIN marcas ma ON ma.id = m.marca_id
   ORDER BY m.creado_en DESC, m.id DESC LIMIT 5`;

/** Adaptador PostgreSQL de las métricas del dashboard. */
class PgEstadisticasQueries extends EstadisticasQueries {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  async obtener() {
    const [resumen, porMarca, porColor, recientes] = await Promise.all([
      this.db.uno(SQL_RESUMEN),
      this.db.varios(SQL_POR_MARCA),
      this.db.varios(SQL_POR_COLOR),
      this.db.varios(SQL_RECIENTES),
    ]);
    return { resumen, porMarca, porColor, recientes };
  }
}

module.exports = PgEstadisticasQueries;
