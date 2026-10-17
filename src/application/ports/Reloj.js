/** Puerto del tiempo del sistema: permite fijar la fecha en las pruebas. */
class Reloj {
  /** @returns {Date} */
  ahora() { throw new Error('Reloj.ahora no implementado'); }

  anioActual() {
    return this.ahora().getFullYear();
  }
}

module.exports = Reloj;
