-- ============================================================================
-- SCRIPT DE BASE DE DATOS PARA NEON POSTGRESQL (ServiPailón)
-- Copia y pega este contenido en el SQL Editor de Neon (https://console.neon.tech)
-- ============================================================================

-- 1. Tabla de Profesionales / Especialistas
CREATE TABLE IF NOT EXISTS professionals (
    id VARCHAR(100) PRIMARY KEY,
    business_name VARCHAR(255) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    area VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    photo TEXT DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    skills JSONB DEFAULT '[]'::jsonb,
    experience INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'available',
    interacciones INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar columna interacciones si la tabla ya existía
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS interacciones INTEGER DEFAULT 0;

-- 2. Tabla de Votos / Interacciones (Evitar votos duplicados por sesión/dispositivo)
CREATE TABLE IF NOT EXISTS specialist_votes (
    id SERIAL PRIMARY KEY,
    pro_id VARCHAR(100) NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_pro_session_vote UNIQUE (pro_id, session_id)
);

-- 3. Tabla de Contrataciones / Solicitudes
CREATE TABLE IF NOT EXISTS hirings (
    id VARCHAR(100) PRIMARY KEY,
    pro_id VARCHAR(100) REFERENCES professionals(id) ON DELETE SET NULL,
    pro_name VARCHAR(255),
    pro_photo TEXT,
    pro_area VARCHAR(50),
    project_title VARCHAR(255) NOT NULL,
    project_desc TEXT NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'in-progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserción de Datos Iniciales (Catálogo de ServiPailón)
INSERT INTO professionals (id, business_name, name, area, title, photo, phone, skills, experience, status)
VALUES
(
    'pro_101',
    'CENTRO DE REHABILITACION FISICA JC',
    'Juan Carlos Choque Llanos',
    'health',
    'Msc. Doctor en Osteópatia',
    'img/fisioterapia.jpeg',
    '+59177806950',
    '["Fisioterapia Geriátrica", "Terapia Deportiva", "Electroterapia", "Tina hidromasajes", "Masaje terapeutico", "Baños de vapor", "Terapia Acuática", "Ecografía Músculo esqueletica"]'::jsonb,
    8,
    'available'
),
(
    'pro_102',
    'VITALDENT',
    'Olga Pacheco Condori',
    'health',
    'Odontóloga',
    'img/vitaldent.jpeg',
    '+59167744463',
    '["Odontología general", "Ortodoncia", "Blanqueamiento Dental", "Endodoncia"]'::jsonb,
    7,
    'available'
),
(
    'pro_103',
    'ASOCIACION DE ARBITROS A.A.P.',
    'Gabriel Avalos Escobar',
    'services',
    'A.A.P. asociación de Árbitros de Pailón',
    'img/arbitro.jpeg',
    '+59177686400',
    '["Árbitro de Futbol", "Ligas estudiantiles", "Liga Seniors", "Campeonatos de Futbol", "Ligas Municipales"]'::jsonb,
    12,
    'available'
),
(
    'pro_104',
    'SAMYMED',
    'Dr. Samuel Israel Moreno',
    'health',
    'Consultorio Médico y Farmacia',
    'img/SAMYMED.jpeg',
    '+59177097224',
    '["Consulta de medicina general", "Medición de Glicemia", "Nebulización", "Limpieza de Oídos", "Atención Medica a Domicilio", "Colocación de Sueros"]'::jsonb,
    9,
    'available'
),
(
    'pro_105',
    'TECHTONI',
    'Elmer Pinto Pitiga',
    'services',
    'Electricista y Contratista',
    'img/TECHTONY.png',
    '+59176600931',
    '["Instalación Domiciliaria", "Diseño e instalación de proyectos", "Tableros de Control y arranque", "Rebobinado, mantenimiento y reparación de motores"]'::jsonb,
    5,
    'available'
),
(
    'pro_106',
    'CENTRO INTEGRAL DE SUPERACIÓN PANAMBÍ (CISPA)',
    'Lic. Jessica Muriel Justiniano Gutiérrez',
    'education',
    'Psicopedagoga Social',
    'img/panambi.jpeg',
    '+59170077868',
    '["Estimulación temprana", "Fortalecimiento escolar", "Oratoria", "Orientación vocacional", "liderasgo", "proyecto de vida", "Escucha activa", "Asesoramiento sobre riesgos sociales", "Consejería de parejas", "Talleres grupales (Educación y desarrollo personal)"]'::jsonb,
    15,
    'available'
),
(
    'pro_107',
    '',
    'Noelia Vallejos Veizaga',
    'services',
    'Nutricionista',
    'img/NEFTIS.jpeg',
    '+59178184654',
    '["Capuchino", "Frappés", "Tés", "Café", "Moca", "Bebidas Frías", "Vita Café", "Malteadas Cremosas", "Mascarilla Antioxidante", "Mascarilla de Spirulina", "Crema Facial de Cocozhi"]'::jsonb,
    7,
    'available'
),
(
    'pro_108',
    'MANITAS CREATIVAS',
    'Lic. Diana Paniagua Calizaya',
    'education',
    'Psicóloga Infantil',
    'img/manitascreativas.jpeg',
    '+59173986342',
    '["Atención de Niños, Jóvenes y Adultos", "Evaluación Psicológica", "Maestra Integradora", "Apoyo Escolar", "Desarrollo Creativo", "Educación Inicial"]'::jsonb,
    5,
    'available'
),
(
    'pro_109',
    '',
    'Pedro',
    'services',
    'Electricista',
    'img/Elmer.jpeg',
    '+59172857225',
    '["Instalaciones Eléctricas", "Mantenimiento General", "Tableros Eléctricos"]'::jsonb,
    7,
    'available'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Contratación de ejemplo
INSERT INTO hirings (id, pro_id, pro_name, pro_photo, pro_area, project_title, project_desc, start_date, status)
VALUES
(
    'hire_201',
    'pro_101',
    'Juan Carlos Choque Llanos',
    'img/fisioterapia.jpeg',
    'salud',
    'Msc. Doctor en Osteópatia',
    'Dolores musculares, Luxaciones, Masajes Terapeuticos, Drenaje Linfático y contracturas.',
    CURRENT_DATE + INTERVAL '1 day',
    'in-progress'
)
ON CONFLICT (id) DO NOTHING;
