const identificar = require('../shared/identificar');
const { ConflictError, NotFoundError } = require('../../domain/shared/errors');

/**
 * Caso de uso: eliminar una marca.
 * Regla de negocio: no se puede eliminar una marca con motocicletas asociadas
 * (la base de datos lo refuerza con ON DELETE RESTRICT).
 */
class EliminarMarca {
  constructor({ marcaRepository, motocicletaRepository }) {
    this.marcas = marcaRepository;
    this.motocicletas = motocicletaRepository;
  }

  async ejecutar(idEntrada) {
    const id = identificar(idEntrada);
    const marca = await this.marcas.buscarPorId(id);
    if (!marca) throw new NotFoundError('Marca no encontrada');

    const asociadas = await this.motocicletas.contarPorMarca(id);
    if (asociadas > 0) {
      throw new ConflictError(`«${marca.nombre}» tiene ${asociadas} motocicleta(s) asociadas y no puede eliminarse`);
    }

    await this.marcas.eliminar(id);
    return { id, nombre: marca.nombre };
  }
}

module.exports = EliminarMarca;
