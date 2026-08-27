-- ============================================================
-- EXPLORANDO LETRAS — Bucket de almacenamiento para fotos
-- Ejecutar en Supabase SQL Editor, después de schema.sql
-- ============================================================

-- Crear el bucket (público para lectura, ya que las fotos validadas
-- se muestran en el mapa público)
insert into storage.buckets (id, name, public)
values ('fotos-registros', 'fotos-registros', true)
on conflict (id) do nothing;

-- Cualquier usuario autenticado puede subir fotos a su propia carpeta
-- (carpeta = su user id, como en el código: `${user.id}/archivo.jpg`)
create policy "fotos_insert_propio"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'fotos-registros'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Lectura pública (las fotos validadas se muestran en el mapa;
-- el filtrado de qué se muestra lo hace la tabla `registros`, no el storage)
create policy "fotos_select_publico"
on storage.objects for select
to public
using (bucket_id = 'fotos-registros');

-- El propio usuario puede borrar/actualizar sus propias fotos
create policy "fotos_delete_propio"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'fotos-registros'
  and (storage.foldername(name))[1] = auth.uid()::text
);
