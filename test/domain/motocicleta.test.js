const test = require('node:test');
const assert = require('node:assert/strict');

const Motocicleta = require('../../src/domain/motocicleta/Motocicleta');
const { Fotografia, CambioFotografia } = require('../../src/domain/motocicleta/Fotografia');
const { AnioFabricacion, Precio, HoraInspeccion, ColorMoto } = require('../../src/domain/motocicleta/value-objects');
const { ValidationError, ValorInvalidoError } = require('../../src/domain/shared/errors');
const { comandoValido } = require('../support/memoria');

test('Motocicleta.crear normaliza los datos válidos', () => {
  const m = Motocicleta.crear(comandoValido(), { anioActual: 2025 });
  assert.equal(m.modelo, 'MT-07');
  assert.equal(m.descripcion, 'Naked bicilíndrica CP2');
  assert.equal(m.precioVenta, 38500000.5);
  assert.equal(m.esNueva, true);
  assert.ok(Object.isFrozen(m), 'la entidad debe ser inmutable');
});

test('Motocicleta.crear acumula todos los errores de validación', () => {
  let err;
  try {
    Motocicleta.crear(comandoValido({ modelo: 'X', cilindradaCc: 10, colorPrincipal: 'Fucsia', estaAsegurada: 'si' }), { anioActual: 2025 });
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof ValidationError);
  assert.deepEqual(Object.keys(err.errors).sort(), ['cilindradaCc', 'colorPrincipal', 'estaAsegurada', 'modelo']);
});

test('Motocicleta.actualizar conserva la identidad del registro', () => {
  const original = Motocicleta.reconstruir({ ...comandoValido(), id: 7, uuidRegistro: 'abc', creadoEn: new Date(0) });
  const nueva = original.actualizar(comandoValido({ modelo: 'MT-09', id: 99 }), { anioActual: 2025 });
  assert.equal(nueva.id, 7);
  assert.equal(nueva.uuidRegistro, 'abc');
  assert.equal(nueva.modelo, 'MT-09');
  assert.equal(original.modelo, 'MT-07', 'la instancia original no cambia');
});

test('AnioFabricacion admite hasta el año siguiente al actual', () => {
  assert.equal(AnioFabricacion.crear(2026, 2025).valor, 2026);
  assert.throws(() => AnioFabricacion.crear(2027, 2025), ValorInvalidoError);
  assert.throws(() => AnioFabricacion.crear('', 2025), ValorInvalidoError);
});

test('Precio redondea a 2 decimales y rechaza negativos', () => {
  assert.equal(Precio.crear('1999.999').valor, 2000);
  assert.throws(() => Precio.crear(-1), ValorInvalidoError);
});

test('HoraInspeccion es opcional y recorta los segundos', () => {
  assert.equal(HoraInspeccion.crear('').valor, null);
  assert.equal(HoraInspeccion.crear('08:15:30').valor, '08:15');
  assert.throws(() => HoraInspeccion.crear('25:00'), ValorInvalidoError);
});

test('ColorMoto solo acepta valores del ENUM', () => {
  assert.equal(ColorMoto.esValido('Rojo'), true);
  assert.equal(ColorMoto.esValido('rojo'), false);
});

test('CambioFotografia interpreta mantener, eliminar y reemplazar', () => {
  const png = `data:image/png;base64,${Buffer.from('fake').toString('base64')}`;
  assert.equal(CambioFotografia.desdeEntrada(undefined).tipo, CambioFotografia.MANTENER);
  assert.equal(CambioFotografia.desdeEntrada(null).tipo, CambioFotografia.ELIMINAR);
  const reemplazo = CambioFotografia.desdeEntrada(png);
  assert.equal(reemplazo.tipo, CambioFotografia.REEMPLAZAR);
  assert.equal(reemplazo.fotografia.mime, 'image/png');
  assert.ok(Buffer.isBuffer(reemplazo.fotografia.contenido));
});

test('Fotografia rechaza formatos no permitidos y archivos grandes', () => {
  assert.throws(() => Fotografia.desdeDataUrl('data:application/pdf;base64,AAAA'), /Formato no permitido/);
  const grande = Buffer.alloc(Fotografia.MAX_BYTES + 1).toString('base64');
  assert.throws(() => Fotografia.desdeDataUrl(`data:image/jpeg;base64,${grande}`), /2 MB/);
});
