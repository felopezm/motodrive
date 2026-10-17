const MotocicletaQueries = require('../../../application/ports/MotocicletaQueries');

const VISTA = `
  m.id, m.modelo, m.uuid_registro AS "uuidRegistro", m.anio_fabricacion AS "anioFabricacion",
  m.precio_venta AS "precioVenta", m.cilindrada_cc AS "cilindradaCc", m.fecha_ingreso AS "fechaIngreso",
  LEFT(m.hora_ultima_inspeccion::text, 5) AS "horaUltimaInspeccion", m.esta_asegurada AS "estaAsegurada",
  m.descripcion, m.kilometraje, m.color_principal AS "colorPrincipal",
  m.creado_en AS "creadoEn", m.actualizado_en AS "actualizadoEn", m.marca_id AS "marcaId",
  (m.fotografia IS NOT NULL) AS "tieneFoto",
  ma.nombre AS "marcaNombre", ma.pais_origen AS "marcaPais"`;

const FROM = 'FROM motocicletas m JOIN marcas ma ON ma.id = m.marca_id';

/** Traducción de los campos ordenables del dominio a columnas SQL (lista blanca). */
const COLUMNAS_ORDEN = {
  id: 'm.id',
  modelo: 'm.modelo',
  marca: 'ma.nombre',
  anio: 'm.anio_fabricacion',
  precio: 'm.precio_venta',
  cilindrada: 'm.cilindrada_cc',
  kilometraje: 'm.kilometraje',
  ingreso: 'm.fecha_ingreso',
  creado: 'm.creado_en',
};

/**
 * Cada filtro decide si aplica y qué condición aporta.
 * Un filtro nuevo se agrega a la lista sin modificar `listar` (Abierto/Cerrado).
 */
const FILTROS = [
  {
    aplica: (c) => c.texto !== null,
    condicion: (i) => `(m.modelo ILIKE $${i} OR ma.nombre ILIKE $${i} OR m.descripcion ILIKE $${i})`,
    valor: (c) => `%${c.texto}%`,
  },
  { aplica: (c) => c.marcaId !== null, condicion: (i) => `m.marca_id = $${i}`, valor: (c) => c.marcaId },
  { aplica: (c) => c.color !== null, condicion: (i) => `m.color_principal = $${i}`, valor: (c) => c.color },
  { aplica: (c) => c.asegurada !== null, condicion: (i) => `m.esta_asegurada = $${i}`, valor: (c) => c.asegurada },
];

/** Adaptador PostgreSQL del modelo de lectura de motocicletas. */
class PgMotocicletaQueries extends MotocicletaQueries {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  async listar(criterios) {
    const params = [];
    const condiciones = FILTROS.filter((f) => f.aplica(criterios)).map((f) => {
      params.push(f.valor(criterios));
      return f.condicion(params.length);
    });
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const orden = `${COLUMNAS_ORDEN[criterios.ordenarPor]} ${criterios.direccion === 'asc' ? 'ASC' : 'DESC'}, m.id DESC`;

    const [conteo, items] = await Promise.all([
      this.db.uno(`SELECT COUNT(*)::int AS total ${FROM} ${where}`, params),
      this.db.varios(
        `SELECT ${VISTA} ${FROM} ${where} ORDER BY ${orden}
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, criterios.limite, criterios.desplazamiento]
      ),
    ]);
    return { items, total: conteo.total };
  }

  detalle(id) {
    return this.db.uno(`SELECT ${VISTA} ${FROM} WHERE m.id = $1`, [id]);
  }

  async fotografia(id) {
    const fila = await this.db.uno(
      'SELECT fotografia AS contenido, fotografia_mime AS mime FROM motocicletas WHERE id = $1 AND fotografia IS NOT NULL',
      [id]
    );
    return fila ? { contenido: fila.contenido, mime: fila.mime || 'application/octet-stream' } : null;
  }
}

module.exports = PgMotocicletaQueries;
