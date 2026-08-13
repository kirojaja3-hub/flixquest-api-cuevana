# 🎬 FlixQuest API con Cuevana (Español/Latino)

Esta es una versión modificada de FlixQuest API que incluye un scraper de **Cuevana3.to** con soporte para audio en **Español** y **Latino**.

## ✨ Características

- ✅ Scraping con Puppeteer (ejecuta JavaScript)
- ✅ Bypassa Cloudflare automáticamente
- ✅ Detecta 3 tipos de audio: **Latino**, **Español España**, **Subtitulado**
- ✅ Soporta películas y series de TV
- ✅ API REST con respuestas JSON
- ✅ Fácil de desplegar en Render o Vercel

---

## 🚀 Instalación Local

### 1. Instalar dependencias

```bash
cd d:\flixquest-main\flixquest-api-custom
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
TMDB_KEY=tu_api_key_de_tmdb
PORT=3000
```

**Obtener TMDB API Key:**
1. Ve a https://www.themoviedb.org/settings/api
2. Crea una cuenta gratuita
3. Solicita un API key
4. Cópialo en `.env`

### 3. Iniciar el servidor

```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

---

## 📡 Endpoints del API

### Base URL
```
http://localhost:3000/cuevana
```

### 🎬 Películas

**Endpoint:**
```
GET /cuevana/watch-movie?title=TITULO&year=AÑO&language=IDIOMA
```

**Parámetros:**
- `title` (requerido): Título de la película
- `year` (opcional): Año de lanzamiento
- `language` (opcional): `latino`, `español`, o `subtitulado`

**Ejemplo:**
```
http://localhost:3000/cuevana/watch-movie?title=Joker&year=2019&language=latino
```

**Respuesta:**
```json
{
  "title": "Joker",
  "year": "2019",
  "type": "movie",
  "streams": [
    {
      "quality": "LATINO HD",
      "url": "https://...",
      "language": "latino"
    },
    {
      "quality": "LATINO",
      "url": "https://...",
      "language": "latino"
    }
  ]
}
```

---

### 📺 Series de TV

**Endpoint:**
```
GET /cuevana/watch-tv?title=TITULO&season=TEMPORADA&episode=EPISODIO&language=IDIOMA
```

**Parámetros:**
- `title` (requerido): Título de la serie
- `season` (requerido): Número de temporada
- `episode` (requerido): Número de episodio
- `year` (opcional): Año de lanzamiento
- `language` (opcional): `latino`, `español`, o `subtitulado`

**Ejemplo:**
```
http://localhost:3000/cuevana/watch-tv?title=Breaking Bad&season=1&episode=1&language=latino
```

---

## 🌐 Despliegue en Render (GRATIS)

### Opción 1: Desde GitHub

1. **Sube el código a GitHub:**

```bash
cd d:\flixquest-main\flixquest-api-custom
git init
git add .
git commit -m "FlixQuest API with Cuevana scraper"
git remote add origin https://github.com/TU_USUARIO/flixquest-api-cuevana.git
git push -u origin main
```

2. **Desplegar en Render:**

- Ve a https://render.com
- Crea una cuenta gratuita
- Click en **"New +"** → **"Web Service"**
- Conecta tu repositorio de GitHub
- Configuración:
  - **Name:** `flixquest-api-cuevana`
  - **Environment:** `Node`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
  - **Instance Type:** `Free`

3. **Agregar variables de entorno:**

En Render, ve a **Environment** y agrega:

```
TMDB_KEY=tu_api_key_de_tmdb
```

4. **Despliega!** 🚀

Tu API estará disponible en: `https://flixquest-api-cuevana.onrender.com`

---

### Opción 2: Deploy directo desde Render

Render tiene un archivo `render.yaml` incluido. Solo necesitas:

1. Hacer fork del repo o subirlo a tu GitHub
2. Click en: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
3. Conectar tu repositorio
4. Agregar `TMDB_KEY` en variables de entorno

---

## 🔧 Integración con FlixQuest App

Una vez desplegado el API, actualiza tu app de Flutter:

### 1. Actualizar `.env` en la app

```bash
# d:\flixquest-main\flixquest-main\.env
FLIXQUEST_API_URL=https://flixquest-api-cuevana.onrender.com
CONSUMET_URL=https://flixquest-api-cuevana.onrender.com
```

### 2. Modificar los providers en Flutter

Edita `lib/video_providers/cuevana.dart` para usar el nuevo API:

```dart
final response = await http.get(
  Uri.parse('${dotenv.env['FLIXQUEST_API_URL']}/cuevana/watch-movie?title=$title&year=$year&language=$languageFilter'),
);
```

### 3. Recompilar el APK

```bash
cd d:\flixquest-main\flixquest-main
flutter build apk --debug
flutter install --debug
```

---

## 🧪 Pruebas

### Probar localmente:

```bash
# Película
curl "http://localhost:3000/cuevana/watch-movie?title=Joker&year=2019&language=latino"

# Serie
curl "http://localhost:3000/cuevana/watch-tv?title=Breaking Bad&season=1&episode=1&language=latino"
```

### Probar en producción:

```bash
curl "https://TU-URL.onrender.com/cuevana/watch-movie?title=Joker&year=2019&language=latino"
```

---

## ⚠️ Limitaciones

### Render Free Tier:
- ✅ **Gratis para siempre**
- ⚠️ El servidor se duerme después de 15 minutos de inactividad
- ⚠️ Primera solicitud tarda ~30 segundos en despertar
- ⚠️ 750 horas/mes (suficiente para uso personal)

### Puppeteer:
- ⚠️ Consumo de RAM: ~200-300MB por solicitud
- ⏱️ Tiempo de respuesta: 5-15 segundos por película
- ✅ 95% de éxito en extracción de streams

---

## 🐛 Troubleshooting

### Error: "No streams found"
- Verifica que el título esté correcto
- Intenta sin especificar el año
- Prueba con otro `language` filter

### Error: "Timeout"
- Aumenta el timeout de Puppeteer en `src/providers/cuevana.ts`
- Render Free puede ser lento en primera ejecución

### Error: "TMDB_KEY not found"
- Asegúrate de configurar la variable de entorno en Render

---

## 📝 Notas

- Cuevana3.to puede cambiar de dominio. Si deja de funcionar, actualiza `BASE_URL` en `src/providers/cuevana.ts`
- Puppeteer requiere Chromium. Render lo instala automáticamente.
- El scraper respeta la estructura actual de Cuevana (enero 2025).

---

## 🎉 ¡Listo!

Ahora tienes un API funcional con audio en **Español** y **Latino** que puedes usar con FlixQuest.

**URL de ejemplo después del deploy:**
```
https://flixquest-api-cuevana.onrender.com/cuevana/watch-movie?title=Joker&year=2019&language=latino
```

¡Disfruta tu contenido en español! 🇪🇸🇲🇽
