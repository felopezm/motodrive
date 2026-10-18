# MotoDrive · CRUD de inventario de motocicletas

Aplicación web full stack para gestionar un inventario de motocicletas. Se despliega con **Docker** en dos contenedores: la app web (Node.js + Express + SPA) y la base de datos (PostgreSQL 16 con volumen persistente).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3 (tema oscuro/claro), JavaScript sin dependencias |
| Backend | Node.js 20, Express 4, `pg` |
| Base de datos | PostgreSQL 16 (alpine) |
| Infraestructura | Dockerfile multi-stage, Docker Compose, red bridge, volumen con nombre |

## Inicio rápido

Requisito: Docker Desktop (o Docker Engine + Compose v2).

```bash
cp .env.example .env          # opcional: cambia credenciales o puertos
docker compose up -d --build
```

Abre **http://localhost:3000**. La base de datos arranca con 10 marcas y 14 motocicletas de ejemplo.

Si los puertos `3000` o `5432` ya están en uso, cambia `APP_PORT` o `DB_PORT` en `.env`.

## Arquitectura de la API: DDD por capas + SOLID

La API sigue una **arquitectura limpia (hexagonal)** con tres capas. Las dependencias siempre apuntan hacia adentro: la infraestructura depende de la aplicación y esta del dominio, nunca al revés.

```
┌──────────────────────────── infrastructure ────────────────────────────┐
│  http/ (Express: controladores, rutas, middleware, presentación)       │
│  persistence/postgres/ (adaptadores Pg* que implementan los puertos)   │
│  ┌──────────────────────────── application ─────────────────────────┐  │
│  │  Casos de uso (1 clase = 1 operación) · puertos de lectura       │  │
│  │  ┌────────────────────────── domain ──────────────────────────┐  │  │
│  │  │  Entidades · objetos de valor · repositorios (puertos)     │  │  │
│  │  │  errores de dominio · reglas de negocio                    │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
        container.js (raíz de composición) conecta las implementaciones
```

```
src/
├── server.js                         # Arranque: configuración → contenedor → listen
├── container.js                      # Raíz de composición: inyecta los adaptadores Pg en los casos de uso
├── domain/                           # ── Núcleo: no depende de Express ni de PostgreSQL
│   ├── shared/                       # ValueObject, Identificador, ValidadorCampos, errores de dominio
│   ├── motocicleta/
│   │   ├── Motocicleta.js            # Entidad raíz del agregado (inmutable, se autovalida)
│   │   ├── value-objects.js          # Modelo, AnioFabricacion, Precio, Cilindrada, Kilometraje, ColorMoto…
│   │   ├── Fotografia.js             # Fotografia + CambioFotografia (mantener/eliminar/reemplazar)
│   │   └── MotocicletaRepository.js  # Puerto de escritura
│   └── marca/
│       ├── Marca.js                  # Entidad + NombreMarca, PaisOrigen
│       └── MarcaRepository.js        # Puerto de escritura
├── application/                      # ── Casos de uso: orquestan el dominio a través de puertos
│   ├── crearCasosDeUso.js            # Fábrica de casos de uso (solo conoce puertos)
│   ├── ports/                        # Puertos de lectura (CQRS ligero) y Reloj
│   ├── shared/identificar.js
│   ├── motocicleta/                  # Crear, Actualizar, Eliminar, Obtener, Listar, ObtenerFotografia,
│   │                                 # CriteriosBusqueda, PreparadorMotocicleta
│   ├── marca/                        # Crear, Actualizar, Eliminar, Listar
│   ├── estadisticas/ObtenerEstadisticas.js
│   └── salud/VerificarSalud.js
└── infrastructure/                   # ── Detalles técnicos intercambiables
    ├── config/entorno.js
    ├── RelojSistema.js
    ├── persistence/postgres/         # PgClient (traduce errores SQL), Pg*Repository, Pg*Queries
    └── http/                         # crearApp, rutas, middleware, presentacion, controllers/
test/                                 # node:test, sin base de datos (adaptadores en memoria)
```

### Cómo se aplica SOLID

| Principio | Dónde se ve |
|---|---|
| **S** – Responsabilidad única | Cada caso de uso es una clase con un solo método `ejecutar`. Cada objeto de valor valida una sola regla. Los controladores solo traducen HTTP. `PgClient` solo ejecuta SQL y traduce errores. |
| **O** – Abierto/Cerrado | Los filtros de búsqueda (`FILTROS`), las columnas ordenables, los cambios de fotografía (`SQL_FOTOGRAFIA`), los errores SQL (`TRADUCCIONES`) y los códigos HTTP (`ESTADOS_DOMINIO`) son tablas: para extenderlos se agrega una entrada sin modificar la lógica existente. |
| **L** – Sustitución de Liskov | `Pg*Repository` y los repositorios en memoria de `test/support/memoria.js` implementan el mismo contrato. Los casos de uso funcionan igual con cualquiera de los dos. |
| **I** – Segregación de interfaces | Los puertos de escritura (`MotocicletaRepository`) están separados de los de lectura (`MotocicletaQueries`, `MarcaQueries`, `EstadisticasQueries`), y cada caso de uso recibe solo lo que necesita. |
| **D** – Inversión de dependencias | Los casos de uso dependen de abstracciones recibidas por constructor. Solo `container.js` conoce PostgreSQL y Express. |

### Patrones de DDD

- **Entidades** (`Motocicleta`, `Marca`): inmutables y siempre válidas. `actualizar()` devuelve una nueva versión que conserva la identidad.
- **Objetos de valor**: encapsulan las reglas de cada campo. `ValidadorCampos` junta todos los errores para devolverlos en una sola respuesta.
- **Repositorios** como puertos del dominio, con su adaptador en la infraestructura.
- **Servicio de aplicación** `PreparadorMotocicleta`: lógica compartida entre crear y actualizar (validar los campos, interpretar la foto y comprobar que la marca exista).
- **Reglas de negocio en el dominio y la aplicación**: no se puede eliminar una marca con motos asociadas y los nombres de marca son únicos sin importar mayúsculas. La base de datos las refuerza además con `ON DELETE RESTRICT` y `UNIQUE`.
- **Errores de dominio** (`ValidationError`, `NotFoundError`, `ConflictError`), que solo la capa HTTP convierte en códigos 400, 404 o 409.

### Pruebas

```bash
npm test
```

Las pruebas cubren el dominio, los casos de uso (con adaptadores en memoria, sin base de datos) y la traducción HTTP. No se necesita Docker para ejecutarlas.

## Estructura general

```
taller-motos/
├── docker-compose.yml      # Servicios db + web, red y volumen
├── Dockerfile              # Imagen multi-stage de la app
├── db/init.sql             # Esquema relacional + datos semilla
├── src/                    # API (ver arquitectura arriba)
├── public/                 # SPA: dashboard, inventario, marcas, modales
├── test/                   # Pruebas unitarias y de casos de uso
└── COMANDOS_DOCKER.md      # Comandos
```

## Modelo de datos (relación 1:N)

```
marcas (1) ──────────< motocicletas (N)
  id SERIAL PK            marca_id INTEGER FK → marcas.id (ON DELETE RESTRICT)
```

### Los 15 campos de `motocicletas`

| # | Campo | Tipo PostgreSQL |
|---|---|---|
| 1 | `id` | `SERIAL` (PK) |
| 2 | `modelo` | `VARCHAR(120)` |
| 3 | `uuid_registro` | `UUID` (`gen_random_uuid()`) |
| 4 | `anio_fabricacion` | `SMALLINT` |
| 5 | `precio_venta` | `NUMERIC(12,2)` |
| 6 | `cilindrada_cc` | `INTEGER` |
| 7 | `fecha_ingreso` | `DATE` |
| 8 | `hora_ultima_inspeccion` | `TIME` |
| 9 | `esta_asegurada` | `BOOLEAN` |
| 10 | `descripcion` | `TEXT` |
| 11 | `kilometraje` | `DOUBLE PRECISION` |
| 12 | `fotografia` | `BYTEA` (imagen binaria) + `fotografia_mime` |
| 13 | `color_principal` | `ENUM color_moto` |
| 14 | `creado_en` | `TIMESTAMPTZ` |
| 15 | `marca_id` | `INTEGER` (FK → `marcas.id`) |

Además, `actualizado_en` (`TIMESTAMPTZ`) se mantiene al día con un trigger. Hay restricciones `CHECK` sobre el año, el precio, la cilindrada y el kilometraje.

## Funcionalidades de la interfaz

- **Dashboard**: KPIs (unidades, valor del inventario, % aseguradas, km promedio), barras por marca, distribución por color y últimos ingresos.
- **Inventario**: tabla con búsqueda, filtros (marca, color, seguro), orden por columna, paginación configurable y acciones de ver, editar y eliminar.
- **Formulario**: los 15 campos agrupados por sección, cada uno con su número y su tipo SQL. Valida en el cliente y en el servidor, incluye selector de color, interruptor booleano y carga de foto por arrastre con compresión automática.
- **Marcas**: CRUD de la tabla padre. La BD impide eliminar una marca que todavía tiene motos (integridad referencial).
- **Toasts**: confirman cada operación guardada en PostgreSQL con ID y UUID, y también avisan de los errores.
- Tema oscuro/claro que se recuerda entre visitas, diseño responsive, navegación por teclado y etiquetas ARIA.

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la app y de la BD |
| GET | `/api/estadisticas` | Datos del dashboard |
| GET | `/api/marcas` | Lista de marcas con conteo y valor |
| POST / PUT / DELETE | `/api/marcas[/:id]` | CRUD de marcas |
| GET | `/api/motocicletas?page&limit&q&marca_id&color&asegurada&sort&order` | Listado paginado |
| GET | `/api/motocicletas/:id` | Detalle |
| GET | `/api/motocicletas/:id/foto` | Imagen binaria |
| POST | `/api/motocicletas` | Crear |
| PUT | `/api/motocicletas/:id` | Actualizar |
| DELETE | `/api/motocicletas/:id` | Eliminar |

## Persistencia

Los datos viven en el volumen `motodrive_pgdata`. `docker compose down` **no** borra los datos; `docker compose down -v` sí los borra y, al volver a levantar, la BD se recrea desde `db/init.sql`.

## Comandos Docker

Consulta [COMANDOS_DOCKER.md](COMANDOS_DOCKER.md)

Puedes agregar una sección de Autores al final del README de MotoDrive. Como no incluiste los nombres, te dejo un bloque editable para completar con los integrantes del proyecto.

Writing

## Autores

Proyecto desarrollado por:

- Federico Lopez
- Duban Cardona
- Cristian Felipe Mora

### Tecnologías y contribuciones

El proyecto integra desarrollo frontend, backend, modelado de bases de datos, arquitectura de software, pruebas automatizadas y despliegue con Docker.

### Proyecto académico
