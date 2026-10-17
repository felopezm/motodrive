const MarcaRepository = require('../../../domain/marca/MarcaRepository');
const { Marca } = require('../../../domain/marca/Marca');

const COLUMNAS = 'id, nombre, pais_origen AS "paisOrigen", creado_en AS "creadoEn"';

/** Adaptador PostgreSQL del repositorio de escritura de marcas. */
class PgMarcaRepository extends MarcaRepository {
  constructor(pgClient) {
    super();
    this.db = pgClient;
  }

  async buscarPorId(id) {
    const fila = await this.db.uno(`SELECT ${COLUMNAS} FROM marcas WHERE id = $1`, [id]);
    return fila ? Marca.reconstruir(fila) : null;
  }

  async buscarPorNombre(nombre) {
    const fila = await this.db.uno(`SELECT ${COLUMNAS} FROM marcas WHERE LOWER(nombre) = LOWER($1)`, [nombre]);
    return fila ? Marca.reconstruir(fila) : null;
  }

  async crear(marca) {
    const fila = await this.db.uno(
      'INSERT INTO marcas (nombre, pais_origen) VALUES ($1, $2) RETURNING id',
      [marca.nombre, marca.paisOrigen]
    );
    return fila.id;
  }

  async actualizar(marca) {
    await this.db.query('UPDATE marcas SET nombre = $1, pais_origen = $2 WHERE id = $3', [marca.nombre, marca.paisOrigen, marca.id]);
  }

  async eliminar(id) {
    const { rowCount } = await this.db.query('DELETE FROM marcas WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = PgMarcaRepository;
