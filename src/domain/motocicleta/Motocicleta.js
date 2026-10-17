const ValidadorCampos = require('../shared/ValidadorCampos');
const Identificador = require('../shared/Identificador');
const {
  Modelo, AnioFabricacion, Precio, Cilindrada, Kilometraje,
  FechaIngreso, HoraInspeccion, EstadoSeguro, Descripcion, ColorMoto,
} = require('./value-objects');

/**
 * Entidad raíz del agregado Motocicleta.
 * Garantiza sus invariantes: nunca existe una instancia con datos inválidos.
 */
class Motocicleta {
  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  /**
   * Crea una motocicleta nueva validando todos los campos de negocio.
   * Los campos de identidad (id, uuid, creadoEn) los asigna la persistencia.
   */
  static crear(datos, { anioActual } = {}) {
    const v = new ValidadorCampos();
    const props = {
      modelo: v.campo('modelo', () => Modelo.crear(datos.modelo)),
      anioFabricacion: v.campo('anioFabricacion', () => AnioFabricacion.crear(datos.anioFabricacion, anioActual)),
      precioVenta: v.campo('precioVenta', () => Precio.crear(datos.precioVenta)),
      cilindradaCc: v.campo('cilindradaCc', () => Cilindrada.crear(datos.cilindradaCc)),
      fechaIngreso: v.campo('fechaIngreso', () => FechaIngreso.crear(datos.fechaIngreso)),
      horaUltimaInspeccion: v.campo('horaUltimaInspeccion', () => HoraInspeccion.crear(datos.horaUltimaInspeccion)),
      estaAsegurada: v.campo('estaAsegurada', () => EstadoSeguro.crear(datos.estaAsegurada)),
      descripcion: v.campo('descripcion', () => Descripcion.crear(datos.descripcion)),
      kilometraje: v.campo('kilometraje', () => Kilometraje.crear(datos.kilometraje)),
      colorPrincipal: v.campo('colorPrincipal', () => ColorMoto.crear(datos.colorPrincipal)),
      marcaId: v.campo('marcaId', () => Identificador.crear(datos.marcaId, 'Selecciona una marca')),
    };
    v.verificar();

    return new Motocicleta({
      id: datos.id ?? null,
      uuidRegistro: datos.uuidRegistro ?? null,
      creadoEn: datos.creadoEn ?? null,
      ...props,
    });
  }

  /** Reconstruye una instancia ya persistida (los datos se asumen válidos). */
  static reconstruir(props) {
    return new Motocicleta(props);
  }

  /** Devuelve una nueva versión validada conservando la identidad del registro. */
  actualizar(datos, opciones) {
    return Motocicleta.crear(
      { ...datos, id: this.id, uuidRegistro: this.uuidRegistro, creadoEn: this.creadoEn },
      opciones
    );
  }

  get esNueva() {
    return this.id == null;
  }

  toPrimitives() {
    return { ...this };
  }
}

module.exports = Motocicleta;
