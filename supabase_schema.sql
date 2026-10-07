-- =========================================================================
-- ESQUEMA DEFINITIVO DE SUPABASE PARA PINMEDIA (PINTEREST CLONE)
-- V4: 100% Real, Tablas Relacionales, RLS Estricto, Storage y user_follows
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT 'Creador visual y coleccionista de ideas ✨',
  website TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los perfiles son públicos para lectura" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Los usuarios pueden insertar su propio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil o admin" 
  ON public.profiles FOR UPDATE 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TRIGGER AUTOMÁTICO AL REGISTRARSE EN SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_user BOOLEAN;
  initial_role TEXT;
  chosen_username TEXT;
BEGIN
  -- Si es el primer usuario, asignarle rol de admin automáticamente
  SELECT COUNT(*) = 0 INTO first_user FROM public.profiles;
  IF first_user THEN
    initial_role := 'admin';
  ELSE
    initial_role := 'user';
  END IF;

  chosen_username := COALESCE(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
  );

  INSERT INTO public.profiles (id, full_name, username, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario PinMedia'),
    chosen_username,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
    initial_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLA DE PINES
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'photography',
  destination_url TEXT,
  tags TEXT[] DEFAULT '{}',
  aspect_ratio TEXT DEFAULT 'aspect-[3/4]',
  likes_count INTEGER DEFAULT 0 NOT NULL,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de pines públicos o propios" 
  ON public.pins FOR SELECT 
  USING (
    is_hidden = false OR 
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Creación de pines solo usuarios autenticados" 
  ON public.pins FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Edición de pines por autor o admin" 
  ON public.pins FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Eliminación de pines por autor o admin" 
  ON public.pins FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. TABLA DE COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de comentarios" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Creación de comentarios solo usuarios autenticados" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eliminación de comentarios por autor o admin" 
  ON public.comments FOR DELETE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. TABLA DE TABLEROS TEMÁTICOS (MOODBOARDS DE PROYECTO)
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven sus propios tableros o públicos"
  ON public.boards FOR SELECT
  USING (true);

CREATE POLICY "Creación de tableros solo usuarios autenticados"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Edición de tableros propios"
  ON public.boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Eliminación de tableros propios"
  ON public.boards FOR DELETE
  USING (auth.uid() = user_id);

-- 6. TABLA DE PINES GUARDADOS (CON TABLERO ASOCIADO)
CREATE TABLE IF NOT EXISTS public.saved_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, pin_id)
);

-- Si la tabla saved_pins ya existía, asegurar la columna board_id:
ALTER TABLE public.saved_pins ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;

ALTER TABLE public.saved_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven sus propios pines guardados" 
  ON public.saved_pins FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Guardar pines para usuarios autenticados" 
  ON public.saved_pins FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Desguardar pines propios" 
  ON public.saved_pins FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. TABLA DE LIKES
CREATE TABLE IF NOT EXISTS public.pin_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, pin_id)
);

ALTER TABLE public.pin_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de likes" 
  ON public.pin_likes FOR SELECT 
  USING (true);

CREATE POLICY "Dar like autenticado" 
  ON public.pin_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Quitar like propio" 
  ON public.pin_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. TABLA REAL DE SEGUIMIENTO (USER FOLLOWS)
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de seguidores" 
  ON public.user_follows FOR SELECT 
  USING (true);

CREATE POLICY "Seguir a un usuario autenticado" 
  ON public.user_follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Dejar de seguir" 
  ON public.user_follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- 8. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'save', 'admin_announcement', 'follow')),
  message TEXT NOT NULL,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios solo ven sus notificaciones" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados insertan notificaciones" 
  ON public.notifications FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios actualizan sus notificaciones" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios borran sus notificaciones" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- 9. CONFIGURACIÓN DE BUCKETS DE ALMACENAMIENTO (STORAGE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'pins', 
  'pins', 
  true, 
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'avatars', 
  'avatars', 
  true, 
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

CREATE POLICY "Acceso público de lectura a buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('pins', 'avatars'));

CREATE POLICY "Subida de archivos solo autenticados"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('pins', 'avatars') AND auth.role() = 'authenticated');

CREATE POLICY "Actualización y borrado de archivos propios o admin"
  ON storage.objects FOR DELETE
  USING (
    auth.uid()::text = (storage.foldername(name))[1] OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 10. TABLA DE REPORTES Y PETICIONES DE MODERACIÓN
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de reportes solo admins"
  ON public.reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Creación de reportes autenticados"
  ON public.reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actualización de reportes solo admins"
  ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

