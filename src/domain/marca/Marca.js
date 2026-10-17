const ValueObject = require('../shared/ValueObject');
const ValidadorCampos = require('../shared/ValidadorCampos');
const { ValorInvalidoError } = require('../shared/errors');

class NombreMarca extends ValueObject {
  static crear(valor) {
    const s = typeof valor === 'string' ? valor.trim() : '';
    if (s.length < 2 || s.length > 80) throw new ValorInvalidoError('El nombre debe tener entre 2 y 80 caracteres');
    return new NombreMarca(s);
  }
}

class PaisOrigen extends ValueObject {
  static crear(valor) {
    const s = typeof valor === 'string' ? valor.trim() : '';
    if (s.length < 2 || s.length > 60) throw new ValorInvalidoError('El país debe tener entre 2 y 60 caracteres');
    return new PaisOrigen(s);
  }
}

/** Entidad Marca: tabla padre de la relación 1:N con Motocicleta. */
class Marca {
  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  static crear(datos) {
    const v = new ValidadorCampos();
    const nombre = v.campo('nombre', () => NombreMarca.crear(datos.nombre));
    const paisOrigen = v.campo('paisOrigen', () => PaisOrigen.crear(datos.paisOrigen));
    v.verificar();
    return new Marca({ id: datos.id ?? null, creadoEn: datos.creadoEn ?? null, nombre, paisOrigen });
  }

  static reconstruir(props) {
    return new Marca(props);
  }

  actualizar(datos) {
    return Marca.crear({ ...datos, id: this.id, creadoEn: this.creadoEn });
  }

  /** Dos marcas con el mismo nombre (sin distinguir mayúsculas) se consideran duplicadas. */
  tieneMismoNombreQue(nombre) {
    return this.nombre.toLocaleLowerCase('es') === String(nombre).trim().toLocaleLowerCase('es');
  }

  toPrimitives() {
    return { ...this };
  }
}

module.exports = { Marca, NombreMarca, PaisOrigen };
