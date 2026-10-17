/**
 * Errores del dominio. Son independientes de HTTP y de la base de datos:
 * la capa de infraestructura decide cómo traducirlos (códigos de estado, etc.).
 */
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Un valor primitivo no cumple las reglas de un objeto de valor. */
class ValorInvalidoError extends DomainError {}

/** Uno o varios campos de una entidad son inválidos. */
class ValidationError extends DomainError {
  constructor(errors = {}, message = 'Datos inválidos') {
    super(message);
    this.errors = errors;
  }
}

/** El recurso solicitado no existe. */
class NotFoundError extends DomainError {}

/** La operación viola una regla de negocio o de integridad. */
class ConflictError extends DomainError {}

module.exports = { DomainError, ValorInvalidoError, ValidationError, NotFoundError, ConflictError };
