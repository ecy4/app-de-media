# 📌 PinMedia - Pinterest Media Dashboard & Creative Feed

Una aplicación web moderna y reactiva inspirada en **Pinterest**, construida con **React**, **Vite**, **Tailwind CSS**, **Lucide Icons** y conectada a **Supabase**.

---

## 🚀 Características Principales

- **Feed en Masonry Responsivo:** Cuadrícula con columnas y alturas variables automáticas con reproducción de video suave al hacer hover.
- **Autenticación con Supabase Auth:** Registro e inicio de sesión seguro con Email y Contraseña.
- **Subida Segura de Archivos a Supabase Storage:** Soporte para fotos (`JPG`, `PNG`, `WebP`, `GIF`) y videos (`MP4`, `WebM`).
- **Navegación e Historial Fluido:** Sincronización total con los botones de *Atrás / Adelante* del navegador (`?pin=id` y `?profile=username`).
- **Perfiles Públicos y Sistema Real de Seguidores:** Visualización de pines creados por cualquier usuario y seguimiento real en la base de datos (`user_follows`).
- **Panel de Administración (Admin Dashboard):** Moderación de pines, suspensión de usuarios y métricas globales.
- **Centro de Notificaciones:** Alertas de *Likes*, *Comentarios* y *Guardados* con insignia de no leídas.
- **Seguridad Web (Hardening):** Políticas Row Level Security (RLS) estrictas, sanitización contra XSS y validación de tipos MIME y URLs seguras (`https://`).

---

## 🛠️ Tecnologías

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS
- **Iconografía:** Lucide React
- **Base de Datos & Auth & Storage:** Supabase (PostgreSQL)
- **Despliegue:** Vercel

---

## 📦 Configuración y Ejecución Local

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz basado en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# APIs opcionales para enriquecer el feed:
VITE_UNSPLASH_ACCESS_KEY=
VITE_PEXELS_API_KEY=
```

### 3. Base de Datos en Supabase
Copia y ejecuta en el **SQL Editor** de Supabase el archivo:
```sql
supabase_schema.sql
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

---

## 🌐 Despliegue en Vercel

1. Sube este repositorio a **GitHub**.
2. En tu panel de [Vercel](https://vercel.com), importa el repositorio.
3. En la sección **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz clic en **Deploy**. El archivo `vercel.json` configurará automáticamente el enrutamiento SPA y la carpeta de salida `dist`.
