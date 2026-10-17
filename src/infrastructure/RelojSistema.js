const Reloj = require('../application/ports/Reloj');

/** Implementación del reloj basada en la hora del sistema. */
class RelojSistema extends Reloj {
  ahora() {
    return new Date();
  }
}

module.exports = RelojSistema;
