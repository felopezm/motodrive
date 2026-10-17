-- =====================================================================
--  MotoDrive · Esquema relacional de inventario de motocicletas
--  Motor: PostgreSQL 16
--  Relación: marcas (1) ──< motocicletas (N)
--  Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor
--  de base de datos (carpeta /docker-entrypoint-initdb.d).
-- =====================================================================

SET client_encoding = 'UTF8';
SET timezone = 'America/Bogota';

-- ---------------------------------------------------------------------
-- Tipo enumerado para el color principal (campo 13)
-- ---------------------------------------------------------------------
CREATE TYPE color_moto AS ENUM (
    'Negro', 'Blanco', 'Rojo', 'Azul', 'Gris', 'Plata',
    'Verde', 'Amarillo', 'Naranja', 'Morado'
);

-- ---------------------------------------------------------------------
-- Tabla padre: MARCAS
-- ---------------------------------------------------------------------
CREATE TABLE marcas (
    id           SERIAL        PRIMARY KEY,
    nombre       VARCHAR(80)   NOT NULL UNIQUE,
    pais_origen  VARCHAR(60)   NOT NULL,
    creado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Tabla hija: MOTOCICLETAS  (15 campos / 15 tipos de dato diferenciados)
-- ---------------------------------------------------------------------
CREATE TABLE motocicletas (
    id                      SERIAL            PRIMARY KEY,                                   --  1. Entero autoincremental (PK)
    modelo                  VARCHAR(120)      NOT NULL,                                      --  2. Cadena de texto variable
    uuid_registro           UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),     --  3. Identificador universal
    anio_fabricacion        SMALLINT          NOT NULL CHECK (anio_fabricacion BETWEEN 1900 AND 2100), -- 4. Entero corto
    precio_venta            NUMERIC(12, 2)    NOT NULL CHECK (precio_venta >= 0),            --  5. Decimal exacto (moneda)
    cilindrada_cc           INTEGER           NOT NULL CHECK (cilindrada_cc BETWEEN 49 AND 3000), -- 6. Entero
    fecha_ingreso           DATE              NOT NULL DEFAULT CURRENT_DATE,                 --  7. Fecha
    hora_ultima_inspeccion  TIME              NULL,                                          --  8. Hora
    esta_asegurada          BOOLEAN           NOT NULL DEFAULT FALSE,                        --  9. Booleano
    descripcion             TEXT              NULL,                                          -- 10. Texto largo
    kilometraje             DOUBLE PRECISION  NOT NULL DEFAULT 0 CHECK (kilometraje >= 0),   -- 11. Flotante doble precisión
    fotografia              BYTEA             NULL,                                          -- 12. Cadena binaria (imagen)
    fotografia_mime         VARCHAR(40)       NULL,                                          --     (tipo MIME de la imagen)
    color_principal         color_moto        NOT NULL DEFAULT 'Negro',                      -- 13. Enumerado
    creado_en               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),                        -- 14. Fecha-hora con zona horaria
    marca_id                INTEGER           NOT NULL                                       -- 15. Llave foránea → marcas.id
                            REFERENCES marcas (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    actualizado_en          TIMESTAMPTZ       NOT NULL DEFAULT NOW()                         --     auditoría de cambios
);

CREATE INDEX idx_motocicletas_marca  ON motocicletas (marca_id);
CREATE INDEX idx_motocicletas_modelo ON motocicletas (LOWER(modelo));

COMMENT ON TABLE  motocicletas                IS 'Inventario de motocicletas (relación N con marcas)';
COMMENT ON COLUMN motocicletas.uuid_registro  IS 'Identificador global único del registro';
COMMENT ON COLUMN motocicletas.fotografia     IS 'Imagen binaria (BYTEA) de la motocicleta';

-- Trigger: mantiene actualizado_en al día en cada UPDATE
CREATE OR REPLACE FUNCTION tocar_actualizado_en() RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_motocicletas_actualizado
BEFORE UPDATE ON motocicletas
FOR EACH ROW EXECUTE FUNCTION tocar_actualizado_en();

-- =====================================================================
--  Datos semilla
-- =====================================================================
INSERT INTO marcas (nombre, pais_origen) VALUES
    ('Honda',           'Japón'),
    ('Yamaha',          'Japón'),
    ('Kawasaki',        'Japón'),
    ('Suzuki',          'Japón'),
    ('Ducati',          'Italia'),
    ('BMW Motorrad',    'Alemania'),
    ('KTM',             'Austria'),
    ('Harley-Davidson', 'Estados Unidos'),
    ('Triumph',         'Reino Unido'),
    ('Bajaj',           'India');

INSERT INTO motocicletas
    (modelo, anio_fabricacion, precio_venta, cilindrada_cc, fecha_ingreso,
     hora_ultima_inspeccion, esta_asegurada, descripcion, kilometraje,
     color_principal, marca_id)
VALUES
    ('CBR 600RR',          2023,  58900000.00,  599, '2025-01-14', '09:30', TRUE,  'Deportiva de cuatro cilindros en línea, ABS combinado y control de tracción HSTC.', 3250.5,  'Rojo',     1),
    ('Africa Twin 1100',   2024,  89500000.00, 1084, '2025-02-03', '14:15', TRUE,  'Doble propósito de aventura con DCT, suspensiones Showa ajustables y pantalla TFT.', 820.0,   'Blanco',   1),
    ('MT-09',              2023,  52990000.00,  890, '2025-02-20', '11:00', TRUE,  'Naked de tres cilindros CP3, quickshifter bidireccional y modos de manejo.', 6120.75, 'Azul',     2),
    ('YZF-R3',             2024,  27900000.00,  321, '2025-03-08', '08:45', FALSE, 'Deportiva de entrada bicilíndrica, ideal para pista y ciudad.', 150.0,   'Azul',     2),
    ('Ninja ZX-10R',       2022,  79900000.00,  998, '2024-11-29', '16:20', TRUE,  'Superbike con electrónica derivada de WorldSBK y unidad IMU Bosch.', 11430.2, 'Verde',    3),
    ('Z900',               2023,  45900000.00,  948, '2025-01-27', '10:10', FALSE, 'Naked sugomi de cuatro cilindros con modos integrados.', 4870.0,  'Negro',    3),
    ('V-Strom 650',        2021,  36500000.00,  645, '2024-10-05', '13:40', TRUE,  'Trail de turismo con motor V-Twin fiable y bajo consumo.', 22810.4, 'Amarillo', 4),
    ('Panigale V4 S',      2024, 145000000.00, 1103, '2025-03-15', '15:05', TRUE,  'Superbike Desmosedici Stradale, suspensiones Öhlins semiactivas.', 95.0,    'Rojo',     5),
    ('R 1250 GS Adventure',2023, 112000000.00, 1254, '2025-02-11', '09:00', TRUE,  'Bóxer ShiftCam, depósito de 30 L y suspensión Dynamic ESA.', 7600.0,  'Gris',     6),
    ('390 Duke',           2024,  24500000.00,  399, '2025-03-21', '17:30', FALSE, 'Naked ligera con chasis trellis y TFT con conectividad.', 60.0,    'Naranja',  7),
    ('Fat Boy 114',        2022,  98000000.00, 1868, '2024-12-18', '12:25', TRUE,  'Cruiser icónica con motor Milwaukee-Eight 114 y llantas sólidas.', 9050.0,  'Negro',    8),
    ('Street Triple 765 RS',2023, 61500000.00,  765, '2025-01-09', '10:50', FALSE, 'Tricilíndrica naked con frenos Brembo Stylema.', 3980.3,  'Plata',    9),
    ('Pulsar NS 200',      2024,   9800000.00,  199, '2025-03-25', '08:15', TRUE,  'Urbana deportiva de refrigeración líquida, excelente relación costo-beneficio.', 1200.0,  'Negro',   10),
    ('Dominar 400',        2023,  16900000.00,  373, '2024-09-30', '11:35', FALSE, 'Sport-tourer con motor monocilíndrico DOHC y ABS de doble canal.', 15600.0, 'Morado',  10);
