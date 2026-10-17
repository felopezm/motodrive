const Identificador = require('../../domain/shared/Identificador');
const { ColorMoto } = require('../../domain/motocicleta/value-objects');

/**
 * Criterios normalizados para listar motocicletas.
 * Cualquier valor no reconocido se descarta en lugar de llegar a la persistencia.
 */
class CriteriosBusqueda {
  static CAMPOS_ORDENABLES = Object.freeze([
    'id', 'modelo', 'marca', 'anio', 'precio', 'cilindrada', 'kilometraje', 'ingreso', 'creado',
  ]);
  static LIMITE_MAXIMO = 100;
  static LIMITE_POR_DEFECTO = 10;

  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  static desde(entrada = {}) {
    const entero = (v, def) => {
      const n = parseInt(v, 10);
      return Number.isInteger(n) ? n : def;
    };
    const marcaId = (() => {
      try { return entrada.marcaId ? Identificador.crear(entrada.marcaId).valor : null; } catch { return null; }
    })();

    return new CriteriosBusqueda({
      pagina: Math.max(1, entero(entrada.pagina, 1)),
      limite: Math.min(CriteriosBusqueda.LIMITE_MAXIMO, Math.max(1, entero(entrada.limite, CriteriosBusqueda.LIMITE_POR_DEFECTO))),
      texto: typeof entrada.texto === 'string' && entrada.texto.trim() ? entrada.texto.trim() : null,
      marcaId,
      color: ColorMoto.esValido(entrada.color) ? entrada.color : null,
      asegurada: entrada.asegurada === 'true' || entrada.asegurada === true ? true
        : entrada.asegurada === 'false' || entrada.asegurada === false ? false : null,
      ordenarPor: CriteriosBusqueda.CAMPOS_ORDENABLES.includes(entrada.ordenarPor) ? entrada.ordenarPor : 'creado',
      direccion: entrada.direccion === 'asc' ? 'asc' : 'desc',
    });
  }

  get desplazamiento() {
    return (this.pagina - 1) * this.limite;
  }
}

module.exports = CriteriosBusqueda;
