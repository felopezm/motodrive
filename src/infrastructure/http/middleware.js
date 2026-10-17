const { ValidationError, NotFoundError, ConflictError } = require('../../domain/shared/errors');
const { aSnakeCase } = require('./presentacion');

/** Propaga al manejador de errores los rechazos de los controladores async (Express 4). */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function cabecerasSeguridad(_req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  next();
}

function recursoNoEncontrado(_req, res) {
  res.status(404).json({ message: 'Recurso no encontrado' });
}

/** Correspondencia error de dominio → código HTTP (Abierto/Cerrado: agregar filas). */
const ESTADOS_DOMINIO = [
  [ValidationError, 400],
  [NotFoundError, 404],
  [ConflictError, 409],
];

const ESTADOS_BODY_PARSER = {
  'entity.too.large': [413, 'La solicitud es demasiado grande (máx. 2 MB por imagen)'],
  'entity.parse.failed': [400, 'JSON mal formado'],
};

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, _req, res, _next) {
  const dominio = ESTADOS_DOMINIO.find(([Tipo]) => err instanceof Tipo);
  if (dominio) {
    const cuerpo = { message: err.message };
    if (err.errors && Object.keys(err.errors).length) cuerpo.errors = aSnakeCase(err.errors);
    return res.status(dominio[1]).json(cuerpo);
  }

  const parser = ESTADOS_BODY_PARSER[err.type];
  if (parser) return res.status(parser[0]).json({ message: parser[1] });

  console.error('[error]', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = { asyncHandler, cabecerasSeguridad, recursoNoEncontrado, manejadorErrores };
