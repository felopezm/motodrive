# Guion comandos Docker · MotoDrive


> Ejecuta todos los comandos desde la carpeta raíz del proyecto (`taller-motos/`).

## Arquitectura que se va a enseñar

```
                    ┌──────────────────────── red bridge: motodrive_net ────────────────────────┐
  Navegador         │                                                                           │
  localhost:3000 ──►│  ┌──────────────────────┐      TCP 5432       ┌─────────────────────────┐ │
                    │  │  motodrive_web       │ ──────────────────► │  motodrive_db           │ │
                    │  │  node:20-alpine      │   DNS interno "db"  │  postgres:16-alpine     │ │
                    │  │  Express + SPA       │                     │                         │ │
                    │  └──────────────────────┘                     └───────────┬─────────────┘ │
                    └───────────────────────────────────────────────────────────┼───────────────┘
                                                                                │ montaje
                                                                   ┌────────────▼─────────────┐
                                                                   │ volumen motodrive_pgdata │
                                                                   │ /var/lib/postgresql/data │
                                                                   └──────────────────────────┘
```

| Recurso | Nombre |
|---|---|
| Contenedor de la app | `motodrive_web` |
| Contenedor de la base de datos | `motodrive_db` |
| Imagen de la app | `motodrive-web:1.0.0` |
| Red | `motodrive_net` (bridge) |
| Volumen persistente | `motodrive_pgdata` |

---

## A. Instalación y verificación del entorno (1–4)

| # | Comando | Para qué sirve |
|---|---|---|
| 1 | `docker --version` | Muestra la versión del cliente Docker instalado. |
| 2 | `docker compose version` | Muestra la versión del plugin Compose v2 que orquesta los servicios. |
| 3 | `docker info` | Muestra el estado del daemon: número de contenedores e imágenes, driver de almacenamiento, **arquitectura del host** (`Architecture: aarch64/x86_64`) y sistema operativo. |
| 4 | `docker pull postgres:16-alpine` | Descarga la imagen oficial de PostgreSQL desde Docker Hub. Es multi-arquitectura: Docker baja automáticamente la variante de tu CPU (amd64 o arm64). |

## B. Imágenes y construcción (5–8)

| # | Comando | Para qué sirve |
|---|---|---|
| 5 | `docker build -t motodrive-web:1.0.0 .` | Construye la imagen de la app con el `Dockerfile` multi-stage: una etapa instala las dependencias y otra deja una imagen final mínima que corre con un usuario sin privilegios. |
| 6 | `docker images` | Lista las imágenes locales con su tamaño. Sirve para mostrar lo liviana que queda la imagen alpine. |
| 7 | `docker history motodrive-web:1.0.0` | Muestra las capas de la imagen y cuánto pesa cada instrucción del Dockerfile. |
| 8 | `docker image inspect motodrive-web:1.0.0 --format "{{.Os}}/{{.Architecture}} · {{.Config.ExposedPorts}} · user={{.Config.User}}"` | Muestra los metadatos de la imagen: SO/arquitectura, puerto expuesto y usuario de ejecución. |

## C. Orquestación con Docker Compose (9–11)

| # | Comando | Para qué sirve |
|---|---|---|
| 9 | `docker compose config` | Valida el `docker-compose.yml` y muestra la configuración final con las variables de entorno ya resueltas. |
| 10 | `docker compose up -d --build` | Construye y levanta **los dos contenedores** en segundo plano, junto con la red y el volumen. `web` espera a que `db` esté *healthy* (`depends_on: condition: service_healthy`). |
| 11 | `docker compose ps` | Muestra el estado de los servicios del proyecto, sus puertos publicados y su salud (`healthy`). |

> 👉 En este punto abre **http://localhost:3000** y muestra la aplicación funcionando.

## D. Gestión e inspección de contenedores (12–20)

| # | Comando | Para qué sirve |
|---|---|---|
| 12 | `docker ps -a` | Lista todos los contenedores del host (activos y detenidos) con su ID, imagen y estado. |
| 13 | `docker compose logs -f web` | Sigue en vivo los logs de la app: la conexión a PostgreSQL y las peticiones. `Ctrl+C` para salir. |
| 14 | `docker logs --tail 30 motodrive_db` | Muestra las últimas 30 líneas del log de PostgreSQL, incluida la ejecución de `init.sql` en el primer arranque. |
| 15 | `docker inspect motodrive_web --format "{{.State.Status}} · health={{.State.Health.Status}} · IP={{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"` | Muestra el estado del contenedor, el resultado del `HEALTHCHECK` y su IP dentro de la red. |
| 16 | `docker exec -it motodrive_db psql -U motodrive -d motodrive` | Abre una consola SQL interactiva dentro del contenedor de la BD. Prueba `\dt`, `\d motocicletas` (muestra los 15 tipos de dato) y `\q` para salir. |
| 17 | `docker exec motodrive_db psql -U motodrive -d motodrive -c "SELECT m.id, m.modelo, ma.nombre AS marca, m.precio_venta, m.creado_en FROM motocicletas m JOIN marcas ma ON ma.id = m.marca_id ORDER BY m.id DESC LIMIT 5;"` | Ejecuta una consulta sin entrar a la consola. Sirve para demostrar que lo que se creó en la interfaz **está guardado en PostgreSQL** y que la relación 1:N funciona (JOIN). |
| 18 | `docker exec -it motodrive_web sh` | Abre una shell dentro del contenedor web. Dentro, prueba `whoami` (sale `node`, sin privilegios), `env \| grep DB_` y `exit`. |
| 19 | `docker top motodrive_db` | Lista los procesos de PostgreSQL que corren dentro del contenedor. |
| 20 | `docker stats --no-stream` | Muestra una vez el consumo de CPU, memoria, red y disco de cada contenedor. |

## E. Redes (21–23)

| # | Comando | Para qué sirve |
|---|---|---|
| 21 | `docker network ls` | Lista las redes. Aparece `motodrive_net` con driver `bridge`. |
| 22 | `docker network inspect motodrive_net` | Muestra la subred, el gateway y los dos contenedores conectados con sus IPs. |
| 23 | `docker exec motodrive_web ping -c 3 db` | Demuestra el **DNS interno** de Docker: la app llega a la BD usando el nombre del servicio (`db`), sin IPs fijas. |

## F. Volúmenes y persistencia (24–28)

| # | Comando | Para qué sirve |
|---|---|---|
| 24 | `docker volume ls` | Lista los volúmenes. Aparece `motodrive_pgdata`. |
| 25 | `docker volume inspect motodrive_pgdata` | Muestra el *mountpoint* real en el host y la fecha de creación del volumen que guarda los datos de PostgreSQL. |
| 26 | `docker exec motodrive_db pg_dump -U motodrive -d motodrive > backup_motodrive.sql` | Genera un respaldo SQL completo de la base de datos en tu máquina. |
| 27 | `docker compose restart web` | Reinicia solo el contenedor de la app, sin tocar la base de datos ni perder datos. |
| 28 | `docker compose down` | **Elimina** los contenedores y la red, pero **conserva el volumen**. Después ejecuta otra vez el comando **#10** y recarga el navegador: los registros siguen ahí. Esta es la prueba de persistencia. |

## G. Diagnóstico y limpieza (29–30)

| # | Comando | Para qué sirve |
|---|---|---|
| 29 | `docker system df` | Muestra cuánto espacio en disco ocupan las imágenes, los contenedores, los volúmenes y la caché de build. |
| 30 | `docker compose down -v --rmi local` | Limpieza total: elimina contenedores, red, **volumen (se borran los datos)** e imagen local. Úsalo solo al final de la demostración o para reiniciar la BD con los datos semilla. |

---

## Extra: construcción para varias arquitecturas (opcional)

Si quieres mostrar que la imagen se puede publicar para distintas CPU (Intel/AMD y ARM/Apple Silicon/Raspberry Pi):

```bash
docker buildx create --name multiarch --use
docker buildx build --platform linux/amd64,linux/arm64 -t <tu-usuario>/motodrive-web:1.0.0 --push .
docker buildx imagetools inspect <tu-usuario>/motodrive-web:1.0.0
```

`--push` requiere `docker login` y una cuenta de Docker Hub, porque las imágenes multi-plataforma no se pueden cargar en el daemon local.

