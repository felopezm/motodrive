/**
 * Objetos de valor de la motocicleta. Cada uno encapsula una sola regla de negocio
 * (Responsabilidad Única) y se construye a través de su fábrica `crear`.
 */
const ValueObject = require('../shared/ValueObject');
const { ValorInvalidoError } = require('../shared/errors');

const vacio = (v) => v === '' || v == null;

class Modelo extends ValueObject {
  static crear(valor) {
    const s = typeof valor === 'string' ? valor.trim() : '';
    if (s.length < 2 || s.length > 120) throw new ValorInvalidoError('El modelo debe tener entre 2 y 120 caracteres');
    return new Modelo(s);
  }
}

class AnioFabricacion extends ValueObject {
  static MINIMO = 1900;

  static crear(valor, anioActual = new Date().getFullYear()) {
    const n = Number(valor);
    const maximo = anioActual + 1;
    if (vacio(valor) || !Number.isInteger(n) || n < AnioFabricacion.MINIMO || n > maximo) {
      throw new ValorInvalidoError(`El año debe estar entre ${AnioFabricacion.MINIMO} y ${maximo}`);
    }
    return new AnioFabricacion(n);
  }
}

class Precio extends ValueObject {
  static MAXIMO = 9999999999.99; // NUMERIC(12,2)

  static crear(valor) {
    const n = Number(valor);
    if (vacio(valor) || !Number.isFinite(n) || n < 0 || n > Precio.MAXIMO) {
      throw new ValorInvalidoError('Ingresa un precio válido mayor o igual a 0');
    }
    return new Precio(Math.round(n * 100) / 100);
  }
}

class Cilindrada extends ValueObject {
  static crear(valor) {
    const n = Number(valor);
    if (vacio(valor) || !Number.isInteger(n) || n < 49 || n > 3000) {
      throw new ValorInvalidoError('La cilindrada debe ser un entero entre 49 y 3000 cc');
    }
    return new Cilindrada(n);
  }
}

class Kilometraje extends ValueObject {
  static MAXIMO = 2000000;

  static crear(valor) {
    const n = Number(valor);
    if (vacio(valor) || !Number.isFinite(n) || n < 0 || n > Kilometraje.MAXIMO) {
      throw new ValorInvalidoError('El kilometraje debe ser un número entre 0 y 2.000.000');
    }
    return new Kilometraje(n);
  }
}

class FechaIngreso extends ValueObject {
  static crear(valor) {
    const ok = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
      && new Date(`${valor}T00:00:00Z`).toISOString().startsWith(valor);
    if (!ok) throw new ValorInvalidoError('Ingresa una fecha válida (AAAA-MM-DD)');
    return new FechaIngreso(valor);
  }
}

class HoraInspeccion extends ValueObject {
  /** Campo opcional: devuelve un objeto con valor null cuando no se informa. */
  static crear(valor) {
    if (vacio(valor)) return new HoraInspeccion(null);
    if (typeof valor !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(valor)) {
      throw new ValorInvalidoError('Ingresa una hora válida (HH:MM)');
    }
    return new HoraInspeccion(valor.slice(0, 5));
  }
}

class EstadoSeguro extends ValueObject {
  static crear(valor) {
    if (typeof valor !== 'boolean') throw new ValorInvalidoError('Indica si la motocicleta está asegurada');
    return new EstadoSeguro(valor);
  }
}

class Descripcion extends ValueObject {
  static MAXIMO = 2000;

  static crear(valor) {
    const s = typeof valor === 'string' ? valor.trim() : '';
    if (s.length > Descripcion.MAXIMO) throw new ValorInvalidoError('La descripción no puede superar 2000 caracteres');
    return new Descripcion(s || null);
  }
}

class ColorMoto extends ValueObject {
  static VALORES = Object.freeze(['Negro', 'Blanco', 'Rojo', 'Azul', 'Gris', 'Plata', 'Verde', 'Amarillo', 'Naranja', 'Morado']);

  static crear(valor) {
    if (!ColorMoto.VALORES.includes(valor)) throw new ValorInvalidoError('Selecciona un color de la lista');
    return new ColorMoto(valor);
  }

  static esValido(valor) {
    return ColorMoto.VALORES.includes(valor);
  }
}

module.exports = {
  Modelo, AnioFabricacion, Precio, Cilindrada, Kilometraje,
  FechaIngreso, HoraInspeccion, EstadoSeguro, Descripcion, ColorMoto,
};
