const { ValorInvalidoError } = require('../shared/errors');

/** Imagen binaria de la motocicleta (se persiste como BYTEA). */
class Fotografia {
  static MIME_PERMITIDOS = Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  static MAX_BYTES = 2 * 1024 * 1024;

  constructor(contenido, mime) {
    this.contenido = contenido;
    this.mime = mime;
    Object.freeze(this);
  }

  /** Crea la fotografía a partir de un data URL en base64 (`data:image/png;base64,...`). */
  static desdeDataUrl(dataUrl) {
    const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl || '');
    if (!match) throw new ValorInvalidoError('La fotografía debe ser una imagen válida');
    const mime = match[1].toLowerCase();
    if (!Fotografia.MIME_PERMITIDOS.includes(mime)) {
      throw new ValorInvalidoError('Formato no permitido (usa JPG, PNG, WEBP o GIF)');
    }
    const contenido = Buffer.from(match[2], 'base64');
    if (contenido.length > Fotografia.MAX_BYTES) throw new ValorInvalidoError('La imagen no puede superar 2 MB');
    return new Fotografia(contenido, mime);
  }
}

/**
 * Describe qué hacer con la fotografía al guardar una motocicleta:
 * mantener la actual, eliminarla o reemplazarla por una nueva.
 */
class CambioFotografia {
  static MANTENER = 'mantener';
  static ELIMINAR = 'eliminar';
  static REEMPLAZAR = 'reemplazar';

  constructor(tipo, fotografia = null) {
    this.tipo = tipo;
    this.fotografia = fotografia;
    Object.freeze(this);
  }

  /** undefined → mantener · null → eliminar · data URL → reemplazar */
  static desdeEntrada(entrada) {
    if (entrada === undefined || entrada === '') return new CambioFotografia(CambioFotografia.MANTENER);
    if (entrada === null) return new CambioFotografia(CambioFotografia.ELIMINAR);
    return new CambioFotografia(CambioFotografia.REEMPLAZAR, Fotografia.desdeDataUrl(entrada));
  }

  get mantiene() { return this.tipo === CambioFotografia.MANTENER; }
}

module.exports = { Fotografia, CambioFotografia };
