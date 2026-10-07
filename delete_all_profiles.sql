-- =========================================================================
-- SCRIPT PARA PURGAR / BORRAR TODOS LOS PERFILES ARCHIVADOS O DE PRUEBA
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- =========================================================================

-- 1. Eliminar perfiles suspendidos o marcados para archivo
DELETE FROM public.profiles 
WHERE is_suspended = true;

-- 2. Eliminar pines huérfanos o que no tengan un perfil válido asociado
DELETE FROM public.pins 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 3. (OPCIONAL) Si deseas vaciar completamente la base de datos de perfiles y empezar desde cero:
-- TRUNCATE TABLE public.user_follows CASCADE;
-- TRUNCATE TABLE public.comments CASCADE;
-- TRUNCATE TABLE public.saved_pins CASCADE;
-- TRUNCATE TABLE public.pin_likes CASCADE;
-- TRUNCATE TABLE public.notifications CASCADE;
-- TRUNCATE TABLE public.pins CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;
-- DELETE FROM auth.users;
