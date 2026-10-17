const { ValorInvalidoError, ValidationError } = require('./errors');

/**
 * Acumula los errores de varios objetos de valor para informarlos todos a la vez,
 * en lugar de fallar con el primero.
 */
class ValidadorCampos {
  constructor() {
    this.errores = {};
  }

  /** Ejecuta la fábrica del campo; si lanza ValorInvalidoError registra el mensaje. */
  campo(nombre, fabrica) {
    try {
      const resultado = fabrica();
      return resultado && typeof resultado === 'object' && 'valor' in resultado ? resultado.valor : resultado;
    } catch (err) {
      if (!(err instanceof ValorInvalidoError)) throw err;
      this.errores[nombre] = err.message;
      return undefined;
    }
  }

  agregar(nombre, mensaje) {
    this.errores[nombre] = mensaje;
  }

  /** Incorpora los errores de una ValidationError previa. */
  absorber(err) {
    if (!(err instanceof ValidationError)) throw err;
    Object.assign(this.errores, err.errors);
  }

  get tieneErrores() {
    return Object.keys(this.errores).length > 0;
  }

  verificar() {
    if (this.tieneErrores) throw new ValidationError({ ...this.errores });
  }
}

module.exports = ValidadorCampos;
