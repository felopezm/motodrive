const MotocicletaRepository = require('../../../domain/motocicleta/MotocicletaRepository');
const Motocicleta = require('../../../domain/motocicleta/Motocicleta');
const { CambioFotografia } = require('../../../domain/motocicleta/Fotografia');

const COLUMNAS = `
  id, modelo, uuid_registro AS "uuidRegistro", anio_fabricacion AS "anioFabricacion",
  precio_venta AS "precioVenta", cilindrada_cc AS "cilindradaCc", fecha_ingreso AS "fechaIngreso",
  LEFT(hora_ultima_inspeccion::text, 5) AS "horaUltimaInspeccion", esta_asegurada AS "estaAsegurada",
  descripcion, kilometraje, color_principal AS "colorPrincipal", marca_id AS "marcaId", creado_en AS "creadoEn"`;

/**
 * Fragmento SQL para cada tipo de cambio de fotografía en un UPDATE.
 * Un tipo nuevo se agrega aquí sin tocar `actualizar` (Abierto/Cerrado).
 */
const SQL_FOTOGRAFIA = {
  [CambioFotografia.MANTENER]: () => ({ sql: '', params: [] }),
  [CambioFotografia.ELIMINAR]: () => ({ sql: ', fotografia = NULL, fotografia_mime = NULL', params: [] }),
  [CambioFotografia.REEMPLAZAR]: (cambio, siguiente) => ({
    sql: `, fotografia = $${siguiente}, fotografia_mime = $${siguiente + 1}`,
    params: [cambio.fotografia.contenido, cambio.fotografia.mime],
  }),
};

/** Adaptador PostgreSQL del repositorio de escritura de motocicletas. */
class PgMotocicletaRepository extends MotocicletaRepository {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  async buscarPorId(id) {
    const fila = await this.db.uno(`SELECT ${COLUMNAS} FROM motocicletas WHERE id = $1`, [id]);
    return fila ? Motocicleta.reconstruir(fila) : null;
  }

  async crear(m, cambio) {
    const foto = cambio.tipo === CambioFotografia.REEMPLAZAR ? cambio.fotografia : null;
    const fila = await this.db.uno(
      `INSERT INTO motocicletas
         (modelo, anio_fabricacion, precio_venta, cilindrada_cc, fecha_ingreso,
          hora_ultima_inspeccion, esta_asegurada, descripcion, kilometraje,
          color_principal, marca_id, fotografia, fotografia_mime)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [...valoresNegocio(m), foto && foto.contenido, foto && foto.mime]
    );
    return fila.id;
  }

  async actualizar(m, cambio) {
    const base = valoresNegocio(m);
    const foto = SQL_FOTOGRAFIA[cambio.tipo](cambio, base.length + 1);
    const params = [...base, ...foto.params, m.id];
    await this.db.query(
      `UPDATE motocicletas SET
         modelo = $1, anio_fabricacion = $2, precio_venta = $3, cilindrada_cc = $4,
         fecha_ingreso = $5, hora_ultima_inspeccion = $6, esta_asegurada = $7,
         descripcion = $8, kilometraje = $9, color_principal = $10, marca_id = $11
         ${foto.sql}
       WHERE id = $${params.length}`,
      params
    );
  }

  async eliminar(id) {
    const { rowCount } = await this.db.query('DELETE FROM motocicletas WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async contarPorMarca(marcaId) {
    const fila = await this.db.uno('SELECT COUNT(*)::int AS total FROM motocicletas WHERE marca_id = $1', [marcaId]);
    return fila.total;
  }
}

/** Valores de negocio en el orden de las columnas $1..$11. */
function valoresNegocio(m) {
  return [
    m.modelo, m.anioFabricacion, m.precioVenta, m.cilindradaCc, m.fechaIngreso,
    m.horaUltimaInspeccion, m.estaAsegurada, m.descripcion, m.kilometraje,
    m.colorPrincipal, m.marcaId,
  ];
}

module.exports = PgMotocicletaRepository;
