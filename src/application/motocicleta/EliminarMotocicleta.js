const identificar = require('../shared/identificar');
const { NotFoundError } = require('../../domain/shared/errors');

/** Caso de uso: dar de baja una motocicleta del inventario. */
class EliminarMotocicleta {
  constructor({ motocicletaRepository }) {
    this.repository = motocicletaRepository;
  }

  async ejecutar(idEntrada) {
    const id = identificar(idEntrada);
    const motocicleta = await this.repository.buscarPorId(id);
    if (!motocicleta) throw new NotFoundError('Motocicleta no encontrada');
    await this.repository.eliminar(id);
    return { id, modelo: motocicleta.modelo };
  }
}

module.exports = EliminarMotocicleta;
