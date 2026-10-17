const identificar = require('../shared/identificar');
const { NotFoundError } = require('../../domain/shared/errors');

/** Caso de uso: modificar los datos de una motocicleta existente. */
class ActualizarMotocicleta {
  constructor({ motocicletaRepository, motocicletaQueries, preparadorMotocicleta }) {
    this.repository = motocicletaRepository;
    this.queries = motocicletaQueries;
    this.preparador = preparadorMotocicleta;
  }

  async ejecutar(idEntrada, comando) {
    const id = identificar(idEntrada);
    const existente = await this.repository.buscarPorId(id);
    if (!existente) throw new NotFoundError('Motocicleta no encontrada');

    const { motocicleta, cambioFotografia } = await this.preparador.preparar(comando, existente);
    await this.repository.actualizar(motocicleta, cambioFotografia);
    return this.queries.detalle(id);
  }
}

module.exports = ActualizarMotocicleta;
