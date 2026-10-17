/** Punto de entrada: carga la configuración, compone la aplicación y la pone a escuchar. */
const cargarEntorno = require('./infrastructure/config/entorno');
const { esperarConexion } = require('./infrastructure/persistence/postgres/conexion');
const { crearContenedor } = require('./container');

async function iniciar() {
  const config = cargarEntorno();
  const { app, pool, cerrar } = crearContenedor(config);

  await esperarConexion(pool);
  const server = app.listen(config.puerto, () => {
    console.log(`[web] MotoDrive escuchando en http://0.0.0.0:${config.puerto} (${config.entorno})`);
  });

  const apagar = (senal) => {
    console.log(`[web] ${senal} recibido, cerrando…`);
    server.close(() => cerrar().then(() => process.exit(0)));
  };
  process.on('SIGTERM', apagar);
  process.on('SIGINT', apagar);
}

iniciar().catch((err) => {
  console.error('[web] Error fatal al iniciar:', err.message);
  process.exit(1);
});
