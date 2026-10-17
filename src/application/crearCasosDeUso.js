/**
 * Fábrica de los casos de uso. Solo depende de los puertos (abstracciones),
 * por lo que se puede usar igual con PostgreSQL o con adaptadores en memoria.
 */
const PreparadorMotocicleta = require('./motocicleta/PreparadorMotocicleta');
const ListarMotocicletas = require('./motocicleta/ListarMotocicletas');
const ObtenerMotocicleta = require('./motocicleta/ObtenerMotocicleta');
const ObtenerFotografia = require('./motocicleta/ObtenerFotografia');
const CrearMotocicleta = require('./motocicleta/CrearMotocicleta');
const ActualizarMotocicleta = require('./motocicleta/ActualizarMotocicleta');
const EliminarMotocicleta = require('./motocicleta/EliminarMotocicleta');
const ListarMarcas = require('./marca/ListarMarcas');
const CrearMarca = require('./marca/CrearMarca');
const ActualizarMarca = require('./marca/ActualizarMarca');
const EliminarMarca = require('./marca/EliminarMarca');
const ObtenerEstadisticas = require('./estadisticas/ObtenerEstadisticas');
const VerificarSalud = require('./salud/VerificarSalud');

/**
 * @param {object} puertos motocicletaRepository, motocicletaQueries, marcaRepository,
 *   marcaQueries, estadisticasQueries, estadoBaseDatos, reloj
 */
function crearCasosDeUso(puertos) {
  const deps = { ...puertos, preparadorMotocicleta: new PreparadorMotocicleta(puertos) };
  return {
    listarMotocicletas: new ListarMotocicletas(deps),
    obtenerMotocicleta: new ObtenerMotocicleta(deps),
    obtenerFotografia: new ObtenerFotografia(deps),
    crearMotocicleta: new CrearMotocicleta(deps),
    actualizarMotocicleta: new ActualizarMotocicleta(deps),
    eliminarMotocicleta: new EliminarMotocicleta(deps),
    listarMarcas: new ListarMarcas(deps),
    crearMarca: new CrearMarca(deps),
    actualizarMarca: new ActualizarMarca(deps),
    eliminarMarca: new EliminarMarca(deps),
    obtenerEstadisticas: new ObtenerEstadisticas(deps),
    verificarSalud: new VerificarSalud(deps),
  };
}

module.exports = crearCasosDeUso;
