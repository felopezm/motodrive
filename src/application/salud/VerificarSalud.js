/** Caso de uso: informar si la aplicación y su base de datos están operativas. */
class VerificarSalud {
  constructor({ estadoBaseDatos }) {
    this.estadoBaseDatos = estadoBaseDatos;
  }

  async ejecutar() {
    try {
      const { hora, version } = await this.estadoBaseDatos.verificar();
      return { operativo: true, hora, version };
    } catch (err) {
      return { operativo: false, mensaje: err.message };
    }
  }
}

module.exports = VerificarSalud;
