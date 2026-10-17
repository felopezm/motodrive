/**
 * Adaptadores en memoria que implementan los mismos puertos que los de PostgreSQL.
 * Al poder sustituirlos sin cambiar los casos de uso, se demuestran los principios
 * de Sustitución de Liskov e Inversión de Dependencias.
 */
const MotocicletaRepository = require('../../src/domain/motocicleta/MotocicletaRepository');
const MarcaRepository = require('../../src/domain/marca/MarcaRepository');
const MotocicletaQueries = require('../../src/application/ports/MotocicletaQueries');
const MarcaQueries = require('../../src/application/ports/MarcaQueries');
const Reloj = require('../../src/application/ports/Reloj');
const Motocicleta = require('../../src/domain/motocicleta/Motocicleta');
const { Marca } = require('../../src/domain/marca/Marca');
const { CambioFotografia } = require('../../src/domain/motocicleta/Fotografia');

class AlmacenMemoria {
  constructor() {
    this.motos = new Map();
    this.fotos = new Map();
    this.marcas = new Map();
    this.secuenciaMoto = 0;
    this.secuenciaMarca = 0;
  }
}

class MemoriaMotocicletaRepository extends MotocicletaRepository {
  constructor(almacen) { super(); this.a = almacen; }

  async buscarPorId(id) { return this.a.motos.get(id) || null; }

  async crear(moto, cambio) {
    const id = ++this.a.secuenciaMoto;
    this.a.motos.set(id, Motocicleta.reconstruir({ ...moto, id, uuidRegistro: `uuid-${id}`, creadoEn: new Date() }));
    if (cambio.tipo === CambioFotografia.REEMPLAZAR) this.a.fotos.set(id, cambio.fotografia);
    return id;
  }

  async actualizar(moto, cambio) {
    this.a.motos.set(moto.id, moto);
    if (cambio.tipo === CambioFotografia.REEMPLAZAR) this.a.fotos.set(moto.id, cambio.fotografia);
    if (cambio.tipo === CambioFotografia.ELIMINAR) this.a.fotos.delete(moto.id);
  }

  async eliminar(id) { this.a.fotos.delete(id); return this.a.motos.delete(id); }

  async contarPorMarca(marcaId) { return [...this.a.motos.values()].filter((m) => m.marcaId === marcaId).length; }
}

class MemoriaMotocicletaQueries extends MotocicletaQueries {
  constructor(almacen) { super(); this.a = almacen; }

  vista(m) {
    const marca = this.a.marcas.get(m.marcaId);
    return { ...m, tieneFoto: this.a.fotos.has(m.id), marcaNombre: marca && marca.nombre };
  }

  async listar(c) {
    let items = [...this.a.motos.values()];
    if (c.marcaId !== null) items = items.filter((m) => m.marcaId === c.marcaId);
    if (c.color !== null) items = items.filter((m) => m.colorPrincipal === c.color);
    if (c.asegurada !== null) items = items.filter((m) => m.estaAsegurada === c.asegurada);
    if (c.texto !== null) items = items.filter((m) => m.modelo.toLowerCase().includes(c.texto.toLowerCase()));
    return { items: items.slice(c.desplazamiento, c.desplazamiento + c.limite).map((m) => this.vista(m)), total: items.length };
  }

  async detalle(id) { const m = this.a.motos.get(id); return m ? this.vista(m) : null; }

  async fotografia(id) { return this.a.fotos.get(id) || null; }
}

class MemoriaMarcaRepository extends MarcaRepository {
  constructor(almacen) { super(); this.a = almacen; }

  async buscarPorId(id) { return this.a.marcas.get(id) || null; }

  async buscarPorNombre(nombre) { return [...this.a.marcas.values()].find((m) => m.tieneMismoNombreQue(nombre)) || null; }

  async crear(marca) {
    const id = ++this.a.secuenciaMarca;
    this.a.marcas.set(id, Marca.reconstruir({ ...marca, id, creadoEn: new Date() }));
    return id;
  }

  async actualizar(marca) { this.a.marcas.set(marca.id, marca); }

  async eliminar(id) { return this.a.marcas.delete(id); }
}

class MemoriaMarcaQueries extends MarcaQueries {
  constructor(almacen) { super(); this.a = almacen; }

  async listar() { return [...this.a.marcas.values()]; }

  async detalle(id) { return this.a.marcas.get(id) || null; }
}

class RelojFijo extends Reloj {
  constructor(fecha) { super(); this.fecha = fecha; }

  ahora() { return this.fecha; }
}

function crearPuertosEnMemoria({ fecha = new Date('2025-06-15T12:00:00Z') } = {}) {
  const almacen = new AlmacenMemoria();
  return {
    almacen,
    motocicletaRepository: new MemoriaMotocicletaRepository(almacen),
    motocicletaQueries: new MemoriaMotocicletaQueries(almacen),
    marcaRepository: new MemoriaMarcaRepository(almacen),
    marcaQueries: new MemoriaMarcaQueries(almacen),
    estadisticasQueries: null,
    estadoBaseDatos: null,
    reloj: new RelojFijo(fecha),
  };
}

/** Comando válido de ejemplo (formato de la capa de aplicación). */
const comandoValido = (extra = {}) => ({
  modelo: 'MT-07',
  anioFabricacion: 2024,
  precioVenta: 38500000.5,
  cilindradaCc: 689,
  fechaIngreso: '2025-03-01',
  horaUltimaInspeccion: '10:30',
  estaAsegurada: true,
  descripcion: '  Naked bicilíndrica CP2  ',
  kilometraje: 1200.75,
  colorPrincipal: 'Azul',
  marcaId: 1,
  ...extra,
});

module.exports = { crearPuertosEnMemoria, comandoValido };
