-- ============================================================
-- EXPLORANDO LETRAS — Esquema de base de datos
-- Ejecutar completo en Supabase SQL Editor (Database > SQL Editor > New query)
-- ============================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PERFILES DE USUARIO
-- Extiende auth.users (que maneja Supabase Auth) con datos propios
-- ============================================================
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_publico text not null,
  rol text not null default 'ciudadano' check (rol in ('admin', 'moderador', 'investigador', 'ciudadano')),
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 2. CAMPAÑAS (Modo Investigación)
-- ============================================================
create table campanas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text not null,
  anio int not null,
  cuadrante_general text,
  fecha_inicio date,
  fecha_fin date,
  estado text not null default 'activa' check (estado in ('activa', 'cerrada')),
  creado_por uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 3. ESPACIOS (polígonos dibujados por el admin dentro de una campaña)
-- ============================================================
create table espacios (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references campanas(id) on delete cascade,
  nombre text not null, -- ej. "Manzana A"
  poligono jsonb not null, -- array de coordenadas [{lat, lng}, ...]
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 4. EQUIPOS
-- ============================================================
create table equipos (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references campanas(id) on delete cascade,
  nombre text not null,
  codigo_invitacion text not null unique,
  creado_en timestamptz not null default now()
);

-- Relación equipo <-> espacio(s) asignado(s) (un equipo puede cubrir varios espacios)
create table equipo_espacios (
  equipo_id uuid not null references equipos(id) on delete cascade,
  espacio_id uuid not null references espacios(id) on delete cascade,
  primary key (equipo_id, espacio_id)
);

-- Relación usuario <-> equipo (a qué equipo pertenece cada estudiante)
create table equipo_miembros (
  equipo_id uuid not null references equipos(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  primary key (equipo_id, usuario_id)
);

-- ============================================================
-- 5. INFORMES (unidad de entrega y revisión — Modo Investigación)
-- ============================================================
create table informes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id),
  campana_id uuid references campanas(id),
  estado text not null default 'en_progreso' check (estado in ('en_progreso', 'entregado', 'revisado')),
  fecha_entrega timestamptz,
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 6. REGISTROS (piezas de letragrafía — tabla central)
-- ============================================================
create table registros (
  id uuid primary key default gen_random_uuid(),
  id_unico text unique, -- formato EL-[cuadrante]-[año]-[###], se genera al validar

  -- Identificación / contexto
  ciudad text not null,
  campana_id uuid references campanas(id),
  espacio_id uuid references espacios(id),
  origen text not null check (origen in ('investigacion', 'personal')),
  informe_id uuid references informes(id),
  usuario_id uuid not null references perfiles(id),
  equipo_id uuid references equipos(id),

  -- Ubicación
  latitud double precision not null,
  longitud double precision not null,
  precision_gps_metros numeric,
  direccion_calle text,
  referencia text,

  -- Multimedia
  foto_url text,

  -- Clasificación (vocabulario controlado, ver tabla lexicos)
  soporte text,
  tecnica text,
  funcion text,
  estado_conservacion text check (estado_conservacion in ('Bueno', 'Regular', 'Malo', 'En riesgo')),

  -- Bloque morfológico
  presencia_serifas text check (presencia_serifas in ('Con serifas', 'Sin serifas (paloseco)', 'Mixta')),
  grosor_trazo text check (grosor_trazo in ('Fino', 'Medio', 'Grueso', 'Variable')),
  estilo_general text,
  texto_principal text,

  -- Estado del ciclo de vida
  estado text not null default 'borrador' check (estado in ('borrador', 'completa', 'pendiente_revision', 'validada', 'rechazada')),
  notas_admin text,

  fecha_registro timestamptz not null default now(),
  fecha_validacion timestamptz
);

-- ============================================================
-- 7. LÉXICOS (vocabularios controlados, editables desde el panel admin)
-- ============================================================
create table lexicos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('soporte', 'tecnica', 'funcion', 'estilo_general')),
  valor text not null,
  activo boolean not null default true,
  unique (categoria, valor)
);

-- Valores iniciales
insert into lexicos (categoria, valor) values
  ('soporte', 'Pared enlucida/revoque'),
  ('soporte', 'Puerta de madera'),
  ('soporte', 'Metal/persiana metálica'),
  ('soporte', 'Vidrio'),
  ('soporte', 'Azulejo/cerámica'),
  ('soporte', 'Poste/columna'),
  ('soporte', 'Cartón o afiche pegado'),
  ('soporte', 'Otro'),
  ('tecnica', 'Pincel y pintura'),
  ('tecnica', 'Aerosol/spray'),
  ('tecnica', 'Stencil/plantilla'),
  ('tecnica', 'Tallado o relieve'),
  ('tecnica', 'Rotulado con cinta o vinil cortado a mano'),
  ('tecnica', 'Tiza o marcador'),
  ('tecnica', 'Mosaico/azulejo pintado'),
  ('tecnica', 'Caligrafía (trazo continuo)'),
  ('tecnica', 'Lettering/rotulación construida'),
  ('tecnica', 'Otro'),
  ('funcion', 'Nombre de negocio/identificación comercial'),
  ('funcion', 'Publicidad de producto o servicio'),
  ('funcion', 'Señalética/dirección'),
  ('funcion', 'Numeración domiciliaria'),
  ('funcion', 'Aviso informal (alquiler, venta, empleo)'),
  ('funcion', 'Graffiti/tag'),
  ('funcion', 'Arte/mural'),
  ('funcion', 'Otro'),
  ('estilo_general', 'Geométrico/bloque'),
  ('estilo_general', 'Manuscrito/cursivo'),
  ('estilo_general', 'Decorativo/ornamental'),
  ('estilo_general', 'Gótico'),
  ('estilo_general', 'Contorneado con sombra/relieve'),
  ('estilo_general', 'Condensado'),
  ('estilo_general', 'Otro');

-- ============================================================
-- 8. AGRUPACIONES VISUALES (herramienta admin, post-hoc)
-- ============================================================
create table agrupaciones_visuales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, -- ej. "Letrista A - estilo recurrente"
  notas text,
  creado_en timestamptz not null default now()
);

create table agrupacion_registros (
  agrupacion_id uuid not null references agrupaciones_visuales(id) on delete cascade,
  registro_id uuid not null references registros(id) on delete cascade,
  primary key (agrupacion_id, registro_id)
);

-- ============================================================
-- 9. ÍNDICES para consultas frecuentes del mapa y panel admin
-- ============================================================
create index idx_registros_estado on registros(estado);
create index idx_registros_origen on registros(origen);
create index idx_registros_ciudad on registros(ciudad);
create index idx_registros_campana on registros(campana_id);
create index idx_registros_usuario on registros(usuario_id);
create index idx_registros_ubicacion on registros(latitud, longitud);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- Con la publishable key todo pasa por estas reglas — sin ellas,
-- cualquiera podría leer/escribir cualquier fila.
-- ============================================================

alter table perfiles enable row level security;
alter table campanas enable row level security;
alter table espacios enable row level security;
alter table equipos enable row level security;
alter table equipo_espacios enable row level security;
alter table equipo_miembros enable row level security;
alter table informes enable row level security;
alter table registros enable row level security;
alter table lexicos enable row level security;
alter table agrupaciones_visuales enable row level security;
alter table agrupacion_registros enable row level security;

-- Función auxiliar: ¿el usuario actual es admin?
create or replace function es_admin()
returns boolean as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol in ('admin', 'moderador')
  );
$$ language sql security definer stable;

-- Perfiles: todos pueden ver perfiles (para mostrar autoría pública),
-- solo el propio usuario o un admin puede editarlos
create policy "perfiles_select_todos" on perfiles for select using (true);
create policy "perfiles_update_propio" on perfiles for update using (auth.uid() = id or es_admin());
create policy "perfiles_insert_propio" on perfiles for insert with check (auth.uid() = id);

-- Léxicos: todos pueden leer, solo admin edita
create policy "lexicos_select_todos" on lexicos for select using (true);
create policy "lexicos_admin_todo" on lexicos for all using (es_admin());

-- Campañas, espacios, equipos: lectura pública (para que estudiantes vean su
-- zona asignada), escritura solo admin
create policy "campanas_select_todos" on campanas for select using (true);
create policy "campanas_admin_todo" on campanas for all using (es_admin());

create policy "espacios_select_todos" on espacios for select using (true);
create policy "espacios_admin_todo" on espacios for all using (es_admin());

create policy "equipos_select_todos" on equipos for select using (true);
create policy "equipos_admin_todo" on equipos for all using (es_admin());

create policy "equipo_espacios_select_todos" on equipo_espacios for select using (true);
create policy "equipo_espacios_admin_todo" on equipo_espacios for all using (es_admin());

create policy "equipo_miembros_select_todos" on equipo_miembros for select using (true);
create policy "equipo_miembros_admin_todo" on equipo_miembros for all using (es_admin());

-- Informes: el usuario ve y edita solo los suyos; admin ve y edita todos
create policy "informes_select_propio_o_admin" on informes for select using (usuario_id = auth.uid() or es_admin());
create policy "informes_insert_propio" on informes for insert with check (usuario_id = auth.uid());
create policy "informes_update_propio_o_admin" on informes for update using (usuario_id = auth.uid() or es_admin());

-- Registros: la regla central
--   - Cualquiera puede ver registros VALIDADOS (mapa público)
--   - El propio autor puede ver/editar sus registros en cualquier estado
--   - Admin ve y edita todo
create policy "registros_select_validados_o_propio" on registros for select
  using (estado = 'validada' or usuario_id = auth.uid() or es_admin());
create policy "registros_insert_propio" on registros for insert
  with check (usuario_id = auth.uid());
create policy "registros_update_propio_borrador_o_admin" on registros for update
  using (
    (usuario_id = auth.uid() and estado in ('borrador', 'completa'))
    or es_admin()
  );

-- Agrupaciones visuales: solo admin
create policy "agrupaciones_admin_todo" on agrupaciones_visuales for all using (es_admin());
create policy "agrupacion_registros_admin_todo" on agrupacion_registros for all using (es_admin());
