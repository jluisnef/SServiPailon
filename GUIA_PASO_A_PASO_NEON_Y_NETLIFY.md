# 🚀 Guía de Despliegue: ServiPailón con Neon PostgreSQL y Netlify

Esta guía explica paso a paso cómo conectar **ServiPailón** a una base de datos en la nube en **Neon (PostgreSQL)** y publicarla en **Netlify**.

---

## 📋 Resumen de lo preparado

1. **[schema.sql](file:///c:/Users/JLMEDINA/Desktop/app/schema.sql)**: Script SQL listo para crear las tablas (`professionals`, `hirings` y `specialist_votes`) con contador de `interacciones` e inserción del catálogo inicial.
2. **[netlify/functions/api.js](file:///c:/Users/JLMEDINA/Desktop/app/netlify/functions/api.js)**: API Serverless que conecta con Neon PostgreSQL de forma segura usando la variable de entorno `DATABASE_URL`, incluyendo endpoints para profesionales, contrataciones y registro de votos anti-spam por sesión.
3. **[netlify.toml](file:///c:/Users/JLMEDINA/Desktop/app/netlify.toml)**: Configuración para desplegar en Netlify con redirecciones automáticas `/api/*` y soporte PWA.
4. **[src/js/StorageManager.js](file:///c:/Users/JLMEDINA/Desktop/app/src/js/StorageManager.js)**: Cliente híbrido que sincroniza en la nube y mantiene soporte offline (PWA) con almacenamiento local de votos.

---

## 🟢 Paso 1: Crear la Base de Datos en Neon (Gratis)

1. Ingresa a **[https://neon.tech](https://neon.tech)** y crea una cuenta gratuita (puedes iniciar sesión con Google o GitHub).
2. Haz clic en **Create Project** (Crear proyecto):
   - **Name**: `servipailon-db`
   - **Postgres version**: la recomendada por defecto (ej. 16 o 17).
   - Haz clic en **Create Project**.
3. En la pantalla principal de tu proyecto en Neon, verás la sección **Connection Details**:
   - Asegúrate de seleccionar **Node.js** o **Connection string**.
   - Verás una URL similar a:
     ```text
     postgresql://usuario:contraseña@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - **Copia esa URL**, la usarás en el Paso 3.

---

## 🟢 Paso 2: Ejecutar el script `schema.sql` en Neon

1. En el menú lateral izquierdo de Neon, haz clic en **SQL Editor**.
2. Abre el archivo **[schema.sql](file:///c:/Users/JLMEDINA/Desktop/app/schema.sql)** de este proyecto, copia todo su contenido y pégalo en el editor de Neon.
3. Haz clic en el botón verde **Run** (Ejecutar).
4. Verás el mensaje de éxito y tus tablas `professionals` y `hirings` quedarán creadas con todos los especialistas cargados.

---

## 🟢 Paso 3: Subir a Netlify y conectar con Neon

### Opción A (Recomendada): Vía GitHub
1. Sube tu carpeta de proyecto a un repositorio en **GitHub**.
2. Entra a **[https://netlify.com](https://netlify.com)** y haz clic en **Add new site** > **Import an existing project**.
3. Selecciona tu repositorio de GitHub.
4. En la configuración de Build:
   - **Build command**: `npm install` (ya está en `netlify.toml`)
   - **Publish directory**: `.` (ya está en `netlify.toml`)
5. Haz clic en **Environment variables** (Variables de entorno) > **Add variable**:
   - **Variable 1**:
     - **Key**: `DATABASE_URL`
     - **Value**: Pega aquí la URL de conexión que copiaste de Neon en el Paso 1.
   - **Variable 2 (Tu Contraseña de Administrador)**:
     - **Key**: `ADMIN_PASSWORD`
     - **Value**: La contraseña secreta que tú elijas (por ejemplo: `MiClaveSegura2026*`). Si no colocas nada, el sistema usará por defecto `ServiPailon20`.
6. Haz clic en **Deploy Site**.

### Opción B: Si ya tienes el sitio en Netlify (Manual)
1. Entra a tu panel de control en **Netlify** > Tu Sitio.
2. Ve a **Site configuration** > **Environment variables**.
3. Agrega o edita las variables:
   - `DATABASE_URL`: tu cadena de conexión de Neon.
   - `ADMIN_PASSWORD`: la contraseña que tú quieras como administrador.
4. Cada vez que quieras **cambiar de contraseña**, solo entras a esa sección en Netlify, cambias el valor de `ADMIN_PASSWORD` y guardas. ¡Se actualizará al instante sin tener que tocar una sola línea de código!

---

## ✅ ¿Cómo verificar que todo funciona?

- Una vez publicado el sitio en Netlify, puedes abrir la URL: `https://tu-sitio.netlify.app/api/professionals`
- Deberá responder en formato JSON con la lista de todos los especialistas traídos directamente desde tu base de datos en Neon.
- Cualquier cambio, nuevo trabajador registrado o cambio de estado desde el panel de administración se guardará en Neon en tiempo real.
