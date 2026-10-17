const test = require('node:test');
const assert = require('node:assert/strict');

const crearCasosDeUso = require('../../src/application/crearCasosDeUso');
const { ValidationError, NotFoundError, ConflictError } = require('../../src/domain/shared/errors');
const { crearPuertosEnMemoria, comandoValido } = require('../support/memoria');

async function escenario() {
  const puertos = crearPuertosEnMemoria();
  const casos = crearCasosDeUso(puertos);
  await casos.crearMarca.ejecutar({ nombre: 'Yamaha', paisOrigen: 'Japón' });
  return { puertos, casos };
}

test('CrearMotocicleta persiste y devuelve la vista con la marca', async () => {
  const { casos } = await escenario();
  const vista = await casos.crearMotocicleta.ejecutar(comandoValido());
  assert.equal(vista.id, 1);
  assert.equal(vista.marcaNombre, 'Yamaha');
  assert.equal(vista.tieneFoto, false);
});

test('CrearMotocicleta reporta juntos los errores de campos y la marca inexistente', async () => {
  const { casos } = await escenario();
  const err = await casos.crearMotocicleta
    .ejecutar(comandoValido({ marcaId: 99, fotografia: 'no-es-imagen' }))
    .catch((e) => e);
  assert.ok(err instanceof ValidationError);
  assert.deepEqual(Object.keys(err.errors).sort(), ['fotografia', 'marcaId']);
});

test('ActualizarMotocicleta mantiene la foto si no se envía y la elimina con null', async () => {
  const { casos } = await escenario();
  const png = `data:image/png;base64,${Buffer.from('img').toString('base64')}`;
  const { id } = await casos.crearMotocicleta.ejecutar(comandoValido({ fotografia: png }));

  let vista = await casos.actualizarMotocicleta.ejecutar(id, comandoValido({ modelo: 'MT-07 Y-AMT' }));
  assert.equal(vista.modelo, 'MT-07 Y-AMT');
  assert.equal(vista.tieneFoto, true);

  vista = await casos.actualizarMotocicleta.ejecutar(id, comandoValido({ fotografia: null }));
  assert.equal(vista.tieneFoto, false);
});

test('ActualizarMotocicleta y EliminarMotocicleta lanzan NotFoundError si no existe', async () => {
  const { casos } = await escenario();
  await assert.rejects(casos.actualizarMotocicleta.ejecutar(42, comandoValido()), NotFoundError);
  await assert.rejects(casos.eliminarMotocicleta.ejecutar(42), NotFoundError);
});

test('Un id no numérico produce ValidationError', async () => {
  const { casos } = await escenario();
  await assert.rejects(casos.obtenerMotocicleta.ejecutar('abc'), ValidationError);
});

test('ListarMotocicletas normaliza criterios y pagina', async () => {
  const { casos } = await escenario();
  for (let i = 0; i < 3; i++) await casos.crearMotocicleta.ejecutar(comandoValido({ modelo: `Moto ${i}` }));
  const r = await casos.listarMotocicletas.ejecutar({ pagina: '2', limite: '2', color: 'NoExiste', ordenarPor: 'DROP TABLE' });
  assert.equal(r.total, 3);
  assert.equal(r.paginas, 2);
  assert.equal(r.items.length, 1);
});

test('CrearMarca rechaza nombres duplicados sin importar mayúsculas', async () => {
  const { casos } = await escenario();
  await assert.rejects(casos.crearMarca.ejecutar({ nombre: 'YAMAHA', paisOrigen: 'Japón' }), ConflictError);
});

test('EliminarMarca impide borrar marcas con motocicletas asociadas', async () => {
  const { casos } = await escenario();
  await casos.crearMotocicleta.ejecutar(comandoValido());
  await assert.rejects(casos.eliminarMarca.ejecutar(1), ConflictError);

  await casos.eliminarMotocicleta.ejecutar(1);
  assert.deepEqual(await casos.eliminarMarca.ejecutar(1), { id: 1, nombre: 'Yamaha' });
});
