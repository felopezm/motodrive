const { Marca } = require('../../domain/marca/Marca');
const { ConflictError } = require('../../domain/shared/errors');

/** Caso de uso: registrar una marca nueva con nombre único. */
class CrearMarca {
  constructor({ marcaRepository, marcaQueries }) {
    this.repository = marcaRepository;
    this.queries = marcaQueries;
  }

  async ejecutar(comando) {
    const marca = Marca.crear(comando);
    if (await this.repository.buscarPorNombre(marca.nombre)) {
      throw new ConflictError(`Ya existe una marca llamada «${marca.nombre}»`);
    }
    const id = await this.repository.crear(marca);
    return this.queries.detalle(id);
  }
}

module.exports = CrearMarca;
