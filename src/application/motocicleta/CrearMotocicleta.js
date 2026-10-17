/** Caso de uso: registrar una motocicleta nueva en el inventario. */
class CrearMotocicleta {
  constructor({ motocicletaRepository, motocicletaQueries, preparadorMotocicleta }) {
    this.repository = motocicletaRepository;
    this.queries = motocicletaQueries;
    this.preparador = preparadorMotocicleta;
  }

  async ejecutar(comando) {
    const { motocicleta, cambioFotografia } = await this.preparador.preparar(comando);
    const id = await this.repository.crear(motocicleta, cambioFotografia);
    return this.queries.detalle(id);
  }
}

module.exports = CrearMotocicleta;
