-- La asesoría de $70 se añade al catálogo sin reutilizar la primera audiencia.
-- Conserva todos los registros, precios históricos, permisos y la agenda común.
alter table public.citas
  drop constraint citas_servicio_valido,
  add constraint citas_servicio_valido
    check (servicio is null or servicio in ('primera', 'segunda', 'tercera', 'asesoria'));

alter table public.solicitudes_pago
  drop constraint solicitud_servicio_valido,
  add constraint solicitud_servicio_valido
    check (servicio in ('primera', 'segunda', 'tercera', 'asesoria'));
