/**
 * Traducción entre el contrato REST (snake_case) y la capa de aplicación (camelCase).
 * Mantener esta conversión en un solo lugar evita que el dominio conozca el formato HTTP.
 */

const aSnake = (clave) => clave.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);

const esObjetoPlano = (v) => v !== null && typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v);

/** Convierte recursivamente las claves de objetos planos a snake_case. */
function aSnakeCase(valor) {
  if (Array.isArray(valor)) return valor.map(aSnakeCase);
  if (esObjetoPlano(valor)) {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [aSnake(k), aSnakeCase(v)]));
  }
  return valor;
}

/** Cuerpo HTTP → comando de motocicleta. `fotografia` ausente significa "no modificar". */
function aComandoMotocicleta(body = {}) {
  return {
    modelo: body.modelo,
    anioFabricacion: body.anio_fabricacion,
    precioVenta: body.precio_venta,
    cilindradaCc: body.cilindrada_cc,
    fechaIngreso: body.fecha_ingreso,
    horaUltimaInspeccion: body.hora_ultima_inspeccion,
    estaAsegurada: body.esta_asegurada,
    descripcion: body.descripcion,
    kilometraje: body.kilometraje,
    colorPrincipal: body.color_principal,
    marcaId: body.marca_id,
    fotografia: Object.prototype.hasOwnProperty.call(body, 'fotografia') ? body.fotografia : undefined,
  };
}

function aComandoMarca(body = {}) {
  return { nombre: body.nombre, paisOrigen: body.pais_origen };
}

/** Query string → entrada de los criterios de búsqueda. */
function aEntradaBusqueda(query = {}) {
  return {
    pagina: query.page,
    limite: query.limit,
    texto: query.q,
    marcaId: query.marca_id,
    color: query.color,
    asegurada: query.asegurada,
    ordenarPor: query.sort,
    direccion: query.order,
  };
}

module.exports = { aSnakeCase, aComandoMotocicleta, aComandoMarca, aEntradaBusqueda };
