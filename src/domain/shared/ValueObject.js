/**
 * Objeto de valor inmutable: se define por su valor y no por su identidad.
 */
class ValueObject {
  constructor(valor) {
    this.valor = valor;
    Object.freeze(this);
  }

  equals(otro) {
    return otro instanceof this.constructor && otro.valor === this.valor;
  }
}

module.exports = ValueObject;
