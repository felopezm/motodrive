/** Caso de uso: listar las marcas con el resumen de su inventario. */
class ListarMarcas {
  constructor({ marcaQueries }) {
    this.queries = marcaQueries;
  }

  ejecutar() {
    return this.queries.listar();
  }
}

module.exports = ListarMarcas;
