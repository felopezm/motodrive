/* eslint-disable no-unused-vars */
/** Puerto del repositorio de escritura de marcas. */
class MarcaRepository {
  /** @returns {Promise<import('./Marca').Marca|null>} */
  async buscarPorId(id) { throw new Error('MarcaRepository.buscarPorId no implementado'); }

  /** Búsqueda sin distinguir mayúsculas. @returns {Promise<import('./Marca').Marca|null>} */
  async buscarPorNombre(nombre) { throw new Error('MarcaRepository.buscarPorNombre no implementado'); }

  /** @returns {Promise<number>} id generado */
  async crear(marca) { throw new Error('MarcaRepository.crear no implementado'); }

  /** @returns {Promise<void>} */
  async actualizar(marca) { throw new Error('MarcaRepository.actualizar no implementado'); }

  /** @returns {Promise<boolean>} */
  async eliminar(id) { throw new Error('MarcaRepository.eliminar no implementado'); }
}

module.exports = MarcaRepository;
