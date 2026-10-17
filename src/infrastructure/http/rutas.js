const express = require('express');
const { asyncHandler: h } = require('./middleware');

/** Tabla de rutas: asocia cada endpoint REST con el método de su controlador. */

function rutasMotocicletas(c) {
  return express.Router()
    .get('/', h(c.listar))
    .post('/', h(c.crear))
    .get('/:id', h(c.obtener))
    .put('/:id', h(c.actualizar))
    .delete('/:id', h(c.eliminar))
    .get('/:id/foto', h(c.fotografia));
}

function rutasMarcas(c) {
  return express.Router()
    .get('/', h(c.listar))
    .post('/', h(c.crear))
    .put('/:id', h(c.actualizar))
    .delete('/:id', h(c.eliminar));
}

function rutasApi({ motocicletas, marcas, sistema }) {
  return express.Router()
    .get('/health', h(sistema.salud))
    .get('/estadisticas', h(sistema.estadisticas))
    .use('/motocicletas', rutasMotocicletas(motocicletas))
    .use('/marcas', rutasMarcas(marcas));
}

module.exports = rutasApi;
