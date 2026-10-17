const identificar = require('../shared/identificar');
const { NotFoundError } = require('../../domain/shared/errors');

/** Caso de uso: consultar el detalle completo de una motocicleta. */
class ObtenerMotocicleta {
  constructor({ motocicletaQueries }) {
    this.queries = motocicletaQueries;
  }

  async ejecutar(idEntrada) {
    const vista = await this.queries.detalle(identificar(idEntrada));
    if (!vista) throw new NotFoundError('Motocicleta no encontrada');
    return vista;
  }
}

module.exports = ObtenerMotocicleta;
