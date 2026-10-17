const MarcaQueries = require('../../../application/ports/MarcaQueries');

const SELECT = `
  SELECT ma.id, ma.nombre, ma.pais_origen AS "paisOrigen", ma.creado_en AS "creadoEn",
         COUNT(m.id)::int AS "totalMotos",
         COALESCE(SUM(m.precio_venta), 0)::float AS "valorInventario"
    FROM marcas ma
    LEFT JOIN motocicletas m ON m.marca_id = ma.id`;

/** Adaptador PostgreSQL del modelo de lectura de marcas. */
class PgMarcaQueries extends MarcaQueries {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  listar() {
    return this.db.varios(`${SELECT} GROUP BY ma.id ORDER BY ma.nombre`);
  }

  detalle(id) {
    return this.db.uno(`${SELECT} WHERE ma.id = $1 GROUP BY ma.id`, [id]);
  }
}

module.exports = PgMarcaQueries;
