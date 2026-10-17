const { aSnakeCase, aComandoMotocicleta, aEntradaBusqueda } = require('../presentacion');

/**
 * Adaptador HTTP de los casos de uso de motocicletas.
 * Solo traduce petición → caso de uso → respuesta; no contiene reglas de negocio.
 */
class MotocicletaController {
  constructor({ listarMotocicletas, obtenerMotocicleta, obtenerFotografia, crearMotocicleta, actualizarMotocicleta, eliminarMotocicleta }) {
    this.casos = { listarMotocicletas, obtenerMotocicleta, obtenerFotografia, crearMotocicleta, actualizarMotocicleta, eliminarMotocicleta };
  }

  listar = async (req, res) => {
    const r = await this.casos.listarMotocicletas.ejecutar(aEntradaBusqueda(req.query));
    res.json({ data: aSnakeCase(r.items), total: r.total, page: r.pagina, limit: r.limite, pages: r.paginas });
  };

  obtener = async (req, res) => {
    res.json(aSnakeCase(await this.casos.obtenerMotocicleta.ejecutar(req.params.id)));
  };

  fotografia = async (req, res) => {
    const foto = await this.casos.obtenerFotografia.ejecutar(req.params.id);
    res.set('Content-Type', foto.mime);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(foto.contenido);
  };

  crear = async (req, res) => {
    const vista = await this.casos.crearMotocicleta.ejecutar(aComandoMotocicleta(req.body));
    res.status(201).json(aSnakeCase(vista));
  };

  actualizar = async (req, res) => {
    const vista = await this.casos.actualizarMotocicleta.ejecutar(req.params.id, aComandoMotocicleta(req.body));
    res.json(aSnakeCase(vista));
  };

  eliminar = async (req, res) => {
    const eliminada = await this.casos.eliminarMotocicleta.ejecutar(req.params.id);
    res.json({ message: 'Motocicleta eliminada', ...eliminada });
  };
}

module.exports = MotocicletaController;
