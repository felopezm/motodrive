/**
 * Raíz de composición (Composition Root).
 * Es el ÚNICO lugar que conoce las implementaciones concretas: crea los adaptadores
 * de infraestructura y los inyecta en los casos de uso por constructor.
 * Para cambiar de motor de base de datos basta con sustituir los adaptadores aquí.
 */
const path = require('path');

const crearCasosDeUso = require('./application/crearCasosDeUso');
const { crearPool } = require('./infrastructure/persistence/postgres/conexion');
const PgClient = require('./infrastructure/persistence/postgres/PgClient');
const PgMotocicletaRepository = require('./infrastructure/persistence/postgres/PgMotocicletaRepository');
const PgMotocicletaQueries = require('./infrastructure/persistence/postgres/PgMotocicletaQueries');
const PgMarcaRepository = require('./infrastructure/persistence/postgres/PgMarcaRepository');
const PgMarcaQueries = require('./infrastructure/persistence/postgres/PgMarcaQueries');
const PgEstadisticasQueries = require('./infrastructure/persistence/postgres/PgEstadisticasQueries');
const PgEstadoBaseDatos = require('./infrastructure/persistence/postgres/PgEstadoBaseDatos');
const RelojSistema = require('./infrastructure/RelojSistema');
const crearApp = require('./infrastructure/http/crearApp');
const MotocicletaController = require('./infrastructure/http/controllers/MotocicletaController');
const MarcaController = require('./infrastructure/http/controllers/MarcaController');
const SistemaController = require('./infrastructure/http/controllers/SistemaController');

function crearContenedor(config) {
  const pool = crearPool(config.baseDatos);
  const db = new PgClient(pool);

  const casos = crearCasosDeUso({
    motocicletaRepository: new PgMotocicletaRepository(db),
    motocicletaQueries: new PgMotocicletaQueries(db),
    marcaRepository: new PgMarcaRepository(db),
    marcaQueries: new PgMarcaQueries(db),
    estadisticasQueries: new PgEstadisticasQueries(db),
    estadoBaseDatos: new PgEstadoBaseDatos(db),
    reloj: new RelojSistema(),
  });

  const app = crearApp({
    controladores: {
      motocicletas: new MotocicletaController(casos),
      marcas: new MarcaController(casos),
      sistema: new SistemaController(casos),
    },
    directorioPublico: path.join(__dirname, '..', 'public'),
  });

  return { app, pool, cerrar: () => db.cerrar() };
}

module.exports = { crearContenedor };
