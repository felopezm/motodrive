const Motocicleta = require('../../domain/motocicleta/Motocicleta');
const { CambioFotografia } = require('../../domain/motocicleta/Fotografia');
const ValidadorCampos = require('../../domain/shared/ValidadorCampos');

/**
 * Servicio de aplicación compartido por "crear" y "actualizar":
 * construye la entidad, interpreta la fotografía y comprueba que la marca exista,
 * reportando todos los errores juntos. Evita duplicar esta lógica (DRY).
 */
class PreparadorMotocicleta {
  constructor({ marcaRepository, reloj }) {
    this.marcaRepository = marcaRepository;
    this.reloj = reloj;
  }

  /**
   * @param {object} comando datos de entrada (camelCase)
   * @param {Motocicleta|null} existente motocicleta a actualizar, o null si es nueva
   * @returns {Promise<{ motocicleta: Motocicleta, cambioFotografia: CambioFotografia }>}
   */
  async preparar(comando, existente = null) {
    const v = new ValidadorCampos();
    const opciones = { anioActual: this.reloj.anioActual() };

    let motocicleta = null;
    try {
      motocicleta = existente ? existente.actualizar(comando, opciones) : Motocicleta.crear(comando, opciones);
    } catch (err) {
      v.absorber(err);
    }

    const cambioFotografia = v.campo('fotografia', () => CambioFotografia.desdeEntrada(comando.fotografia));

    if (motocicleta && !(await this.marcaRepository.buscarPorId(motocicleta.marcaId))) {
      v.agregar('marcaId', 'La marca seleccionada no existe');
    }

    v.verificar();
    return { motocicleta, cambioFotografia };
  }
}

module.exports = PreparadorMotocicleta;
