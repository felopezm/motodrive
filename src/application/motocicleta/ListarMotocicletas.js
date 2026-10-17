const CriteriosBusqueda = require('./CriteriosBusqueda');

/** Caso de uso: listar el inventario con filtros, orden y paginación. */
class ListarMotocicletas {
  constructor({ motocicletaQueries }) {
    this.queries = motocicletaQueries;
  }

  async ejecutar(entrada) {
    const criterios = CriteriosBusqueda.desde(entrada);
    const { items, total } = await this.queries.listar(criterios);
    return {
      items,
      total,
      pagina: criterios.pagina,
      limite: criterios.limite,
      paginas: Math.max(1, Math.ceil(total / criterios.limite)),
    };
  }
}

module.exports = ListarMotocicletas;
