const { aSnakeCase } = require('../presentacion');

/** Endpoints transversales: salud del sistema y estadísticas del dashboard. */
class SistemaController {
  constructor({ verificarSalud, obtenerEstadisticas }) {
    this.casos = { verificarSalud, obtenerEstadisticas };
  }

  salud = async (_req, res) => {
    const r = await this.casos.verificarSalud.ejecutar();
    if (!r.operativo) return res.status(503).json({ status: 'error', database: 'down', message: r.mensaje });
    res.json({ status: 'ok', database: 'up', time: r.hora, version: r.version });
  };

  estadisticas = async (_req, res) => {
    res.json(aSnakeCase(await this.casos.obtenerEstadisticas.ejecutar()));
  };
}

module.exports = SistemaController;
