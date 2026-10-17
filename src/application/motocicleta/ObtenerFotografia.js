const identificar = require('../shared/identificar');
const { NotFoundError } = require('../../domain/shared/errors');

/** Caso de uso: recuperar la imagen binaria almacenada de una motocicleta. */
class ObtenerFotografia {
  constructor({ motocicletaQueries }) {
    this.queries = motocicletaQueries;
  }

  async ejecutar(idEntrada) {
    const foto = await this.queries.fotografia(identificar(idEntrada));
    if (!foto) throw new NotFoundError('La motocicleta no tiene fotografía');
    return foto;
  }
}

module.exports = ObtenerFotografia;
