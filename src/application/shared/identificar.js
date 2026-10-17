const Identificador = require('../../domain/shared/Identificador');
const { ValorInvalidoError, ValidationError } = require('../../domain/shared/errors');

/** Convierte el id recibido en un entero válido o lanza ValidationError. */
function identificar(valor) {
  try {
    return Identificador.crear(valor).valor;
  } catch (err) {
    if (err instanceof ValorInvalidoError) throw new ValidationError({}, err.message);
    throw err;
  }
}

module.exports = identificar;
