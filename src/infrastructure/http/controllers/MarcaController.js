const { aSnakeCase, aComandoMarca } = require('../presentacion');

/** Adaptador HTTP de los casos de uso de marcas. */
class MarcaController {
  constructor({ listarMarcas, crearMarca, actualizarMarca, eliminarMarca }) {
    this.casos = { listarMarcas, crearMarca, actualizarMarca, eliminarMarca };
  }

  listar = async (_req, res) => {
    res.json(aSnakeCase(await this.casos.listarMarcas.ejecutar()));
  };

  crear = async (req, res) => {
    res.status(201).json(aSnakeCase(await this.casos.crearMarca.ejecutar(aComandoMarca(req.body))));
  };

  actualizar = async (req, res) => {
    res.json(aSnakeCase(await this.casos.actualizarMarca.ejecutar(req.params.id, aComandoMarca(req.body))));
  };

  eliminar = async (req, res) => {
    const eliminada = await this.casos.eliminarMarca.ejecutar(req.params.id);
    res.json({ message: 'Marca eliminada', ...eliminada });
  };
}

module.exports = MarcaController;
