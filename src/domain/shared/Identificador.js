const ValueObject = require('./ValueObject');
const { ValorInvalidoError } = require('./errors');

/** Identificador numérico positivo (llaves primarias y foráneas). */
class Identificador extends ValueObject {
  static crear(valor, mensaje = 'Identificador inválido') {
    const n = Number(valor);
    if (valor === '' || valor == null || !Number.isInteger(n) || n <= 0) throw new ValorInvalidoError(mensaje);
    return new Identificador(n);
  }
}

module.exports = Identificador;
