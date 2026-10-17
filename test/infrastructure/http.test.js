const test = require('node:test');
const assert = require('node:assert/strict');

const { aSnakeCase, aComandoMotocicleta } = require('../../src/infrastructure/http/presentacion');
const { manejadorErrores } = require('../../src/infrastructure/http/middleware');
const { ValidationError, NotFoundError, ConflictError } = require('../../src/domain/shared/errors');

function respuestaFalsa() {
  return {
    estado: null,
    cuerpo: null,
    status(s) { this.estado = s; return this; },
    json(b) { this.cuerpo = b; return this; },
  };
}

test('aSnakeCase convierte claves anidadas y respeta Date y Buffer', () => {
  const fecha = new Date();
  const buf = Buffer.from('x');
  assert.deepEqual(
    aSnakeCase({ marcaId: 1, porMarca: [{ valorTotal: 2 }], creadoEn: fecha, foto: buf }),
    { marca_id: 1, por_marca: [{ valor_total: 2 }], creado_en: fecha, foto: buf }
  );
});

test('aComandoMotocicleta distingue fotografía ausente de fotografía null', () => {
  assert.equal(aComandoMotocicleta({}).fotografia, undefined);
  assert.equal(aComandoMotocicleta({ fotografia: null }).fotografia, null);
  assert.equal(aComandoMotocicleta({ anio_fabricacion: 2024 }).anioFabricacion, 2024);
});

test('manejadorErrores traduce errores de dominio a códigos HTTP', () => {
  const casos = [
    [new ValidationError({ marcaId: 'Selecciona una marca' }), 400],
    [new NotFoundError('no'), 404],
    [new ConflictError('dup'), 409],
  ];
  for (const [err, estado] of casos) {
    const res = respuestaFalsa();
    manejadorErrores(err, {}, res, () => {});
    assert.equal(res.estado, estado);
  }

  const res = respuestaFalsa();
  manejadorErrores(new ValidationError({ marcaId: 'x' }), {}, res, () => {});
  assert.deepEqual(res.cuerpo.errors, { marca_id: 'x' }, 'las claves de error usan el contrato snake_case');
});
