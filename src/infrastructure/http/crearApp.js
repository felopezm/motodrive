const express = require('express');
const rutasApi = require('./rutas');
const { cabecerasSeguridad, recursoNoEncontrado, manejadorErrores } = require('./middleware');

/**
 * Construye la aplicación Express a partir de controladores ya configurados.
 * No crea dependencias: las recibe (Inversión de Dependencias).
 */
function crearApp({ controladores, directorioPublico }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '4mb' })); // fotografías en base64 (≤ 2 MB)
  app.use(cabecerasSeguridad);

  app.use('/api', rutasApi(controladores));
  app.use('/api', recursoNoEncontrado);

  app.use(express.static(directorioPublico, { maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile('index.html', { root: directorioPublico }));

  app.use(manejadorErrores);
  return app;
}

module.exports = crearApp;
