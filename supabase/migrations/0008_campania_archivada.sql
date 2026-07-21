-- Las campañas ahora se pueden archivar: dejan el tablero de la agencia
-- (van a la sección Archivadas) y desaparecen del portal del cliente.
alter type public.estado_campania add value if not exists 'archivada';
