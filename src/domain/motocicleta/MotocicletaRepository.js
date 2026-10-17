/* eslint-disable no-unused-vars */
/**
 * Puerto (interfaz) del repositorio de escritura de motocicletas.
 * El dominio depende de esta abstracción; la infraestructura la implementa
 * (Inversión de Dependencias). Cualquier implementación debe respetar el
 * contrato para ser intercambiable (Sustitución de Liskov).
 */
class MotocicletaRepository {
  /** @returns {Promise<import('./Motocicleta')|null>} */
  async buscarPorId(id) { throw new Error('MotocicletaRepository.buscarPorId no implementado'); }

  /**
   * @param {import('./Motocicleta')} motocicleta
   * @param {import('./Fotografia').CambioFotografia} cambioFotografia
   * @returns {Promise<number>} id generado
   */
  async crear(motocicleta, cambioFotografia) { throw new Error('MotocicletaRepository.crear no implementado'); }

  /** @returns {Promise<void>} */
  async actualizar(motocicleta, cambioFotografia) { throw new Error('MotocicletaRepository.actualizar no implementado'); }

  /** @returns {Promise<boolean>} true si existía */
  async eliminar(id) { throw new Error('MotocicletaRepository.eliminar no implementado'); }

  /** @returns {Promise<number>} */
  async contarPorMarca(marcaId) { throw new Error('MotocicletaRepository.contarPorMarca no implementado'); }
}

module.exports = MotocicletaRepository;
