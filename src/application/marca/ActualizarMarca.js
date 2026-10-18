const identificar = require('../shared/identificar');
const { ConflictError, NotFoundError } = require('../../domain/shared/errors');

/** Caso de uso: renombrar una marca o cambiar su país de origen. */
class ActualizarMarca {
  constructor({ marcaRepository, marcaQueries }) {
    this.repository = marcaRepository;
    this.queries = marcaQueries;
  }

  async ejecutar(idEntrada, comando) {
    const id = identificar(idEntrada);
    const existente = await this.repository.buscarPorId(id);
    if (!existente) throw new NotFoundError('Marca no encontrada');

    const marca = existente.actualizar(comando);
    const homonima = await this.repository.buscarPorNombre(marca.nombre);
    if (homonima && homonima.id !== id) throw new ConflictError(`Ya existe una marca llamada «${marca.nombre}»`);

    await this.repository.actualizar(marca);
    return this.queries.detalle(id);
  }
}


module.exports = ActualizarMarca;
