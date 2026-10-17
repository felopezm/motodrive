/* eslint-disable no-unused-vars */
/**
 * Puerto de LECTURA de motocicletas (modelo de lectura / CQRS ligero).
 * Se separa del repositorio de escritura para que cada cliente dependa solo
 * de lo que usa (Segregación de Interfaces).
 * Devuelve vistas planas listas para presentar (incluyen datos de la marca).
 */
class MotocicletaQueries {
  /**
   * @param {import('../motocicleta/CriteriosBusqueda')} criterios
   * @returns {Promise<{ items: object[], total: number }>}
   */
  async listar(criterios) { throw new Error('MotocicletaQueries.listar no implementado'); }

  /** @returns {Promise<object|null>} */
  async detalle(id) { throw new Error('MotocicletaQueries.detalle no implementado'); }

  /** @returns {Promise<{ contenido: Buffer, mime: string }|null>} */
  async fotografia(id) { throw new Error('MotocicletaQueries.fotografia no implementado'); }
}

module.exports = MotocicletaQueries;
