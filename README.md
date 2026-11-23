# Portafolio Personal v2.0 – Agustín Stoppello

Este repositorio contiene el código de mi portafolio personal como Diseñador UX/UI y Desarrollador Frontend, desplegado en **Cloudflare Workers** con **Static Assets** y base de datos **Cloudflare D1**.

## ✨ Características Principales

* **Sobre mí:** Introducción a mi perfil profesional, enfoque de trabajo y herramientas que domino.
* **Proyectos:** Galería visual de proyectos con gestión dinámica desde el panel de administración (`/admin.html`).
* **Blog:** Artículos publicados dinámicamente desde Cloudflare D1 (`/blog.html`).
* **Contacto:** Formulario de contacto y enlaces directos a redes profesionales.
* **Políticas:** Política de Privacidad y Política de Cookies.

---

## 💻 Stack Tecnológico

* 🏛️ **Frontend:** HTML5, CSS3, Bootstrap 5 y JavaScript vanilla (servido desde `public/` vía Cloudflare Workers Static Assets).
* ⚡ **Backend / API:** Cloudflare Worker (`src/index.js`).
* 🗄️ **Base de datos:** Cloudflare D1 (SQLite en el edge) con migraciones en `migrations/`.
* 📊 **Google Analytics:** Seguimiento de tráfico y comportamiento.

---

## 🚀 Desarrollo y Despliegue

```bash
# Instalar dependencias
npm install

# Aplicar migraciones localmente
npm run db:migrate:local

# Levantar entorno local
npm run dev

# Aplicar migraciones en producción (Cloudflare D1)
npm run db:migrate:remote

# Desplegar a Cloudflare Workers
npm run deploy
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la Licencia MIT.
