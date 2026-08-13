# 🚀 INSTRUCCIONES PARA DESPLEGAR API CON CUEVANA

## ✅ LO QUE YA ESTÁ LISTO

He modificado el FlixQuest API oficial para incluir un scraper de **Cuevana3.to** con soporte para:
- ✅ Audio **Latino** 
- ✅ Audio **Español España**
- ✅ **Subtitulado**
- ✅ Scraping con **Puppeteer** (ejecuta JavaScript, bypassa Cloudflare)
- ✅ Soporta películas y series de TV

---

## 📋 OPCIÓN 1: DEPLOY EN RENDER (RECOMENDADO - GRATIS)

### Paso 1: Subir el código a GitHub

```powershell
cd d:\flixquest-main\flixquest-api-custom

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "FlixQuest API con scraper de Cuevana (Latino/Español)"

# IMPORTANTE: Crea un repositorio en GitHub primero
# Ve a: https://github.com/new
# Nombre sugerido: flixquest-api-cuevana
# NO marques "Initialize with README"

# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/flixquest-api-cuevana.git
git branch -M main
git push -u origin main
```

### Paso 2: Desplegar en Render

1. **Ve a Render**: https://render.com
2. **Crea una cuenta gratuita** (con GitHub)
3. Click en **"New +"** → **"Web Service"**
4. Click en **"Connect a repository"** → Selecciona tu repo `flixquest-api-cuevana`
5. **Configuración:**
   ```
   Name: flixquest-api-cuevana
   Region: Oregon (US West) [o el más cercano]
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
6. Click en **"Advanced"** → **"Add Environment Variable":**
   ```
   TMDB_KEY = a6510f4e165310dd55392863ed1ccd2b
   ```
7. Click en **"Create Web Service"**

### Paso 3: Esperar el deploy

- ⏱️ Primera vez tarda **5-10 minutos** (instala Puppeteer + Chromium)
- Render te dará una URL como: `https://flixquest-api-cuevana.onrender.com`
- ✅ Cuando veas **"Your service is live"** está listo

### Paso 4: Probar el API

Abre en tu navegador o usa `curl`:

```bash
# Probar homepage
https://flixquest-api-cuevana.onrender.com/cuevana

# Probar película
https://flixquest-api-cuevana.onrender.com/cuevana/watch-movie?title=Joker&year=2019&language=latino
```

---

## 📋 OPCIÓN 2: PRUEBA LOCAL PRIMERO

Si quieres probar localmente antes de desplegar:

```powershell
cd d:\flixquest-main\flixquest-api-custom

# Instalar dependencias (tarda 5-10 min, descarga Chromium)
npm install

# Iniciar servidor
npm start
```

El servidor estará en: **http://localhost:3000**

**Probar:**
```
http://localhost:3000/cuevana
http://localhost:3000/cuevana/watch-movie?title=Joker&year=2019&language=latino
```

---

## 🔗 INTEGRAR CON FLIXQUEST APP

Una vez que tengas el API en Render (o local), actualiza la app:

### Opción A: Usar SOLO el API de Cuevana (Español/Latino)

Edita: `d:\flixquest-main\flixquest-main\.env`

```bash
TMDB_API_KEY="a6510f4e165310dd55392863ed1ccd2b"
FLIXQUEST_API_URL="https://flixquest-api-cuevana.onrender.com"
CONSUMET_URL="https://flixquest-api-cuevana.onrender.com"
```

### Opción B: Combinar con otros providers

Puedes mantener tu configuración actual y solo agregar Cuevana como opción adicional modificando el código Flutter.

---

## 🎯 ENDPOINTS DEL API

### Base URL
```
https://TU-URL.onrender.com/cuevana
```

### Películas
```
GET /cuevana/watch-movie?title=TITULO&year=AÑO&language=IDIOMA
```

**Parámetros:**
- `title` (requerido): Título de la película
- `year` (opcional): Año de lanzamiento  
- `language` (opcional): `latino`, `español`, o `subtitulado`

**Ejemplo:**
```
https://flixquest-api-cuevana.onrender.com/cuevana/watch-movie?title=Spiderman&year=2021&language=latino
```

**Respuesta:**
```json
{
  "title": "Spiderman",
  "year": "2021",
  "type": "movie",
  "streams": [
    {
      "quality": "LATINO HD",
      "url": "https://...",
      "language": "latino"
    }
  ]
}
```

### Series de TV
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
https://flixquest-api-cuevana.onrender.com/cuevana/watch-tv?title=Breaking Bad&season=1&episode=1&language=latino
```

---

## ⚠️ LIMITACIONES DE RENDER FREE

- ✅ **Gratis para siempre**
- ⚠️ El servidor **se duerme** después de 15 minutos sin uso
- ⚠️ Primera solicitud tarda **30-60 segundos** en despertar
- ⚠️ **750 horas/mes** de uso (suficiente para uso personal)
- ⏱️ Cada scraping tarda **5-15 segundos** (Puppeteer + Cuevana)

**Solución al "sleep":**
- Implementar un "keep-alive" con un ping cada 10 minutos
- O usar Render Paid ($7/mes, sin sleep)

---

## 🐛 TROUBLESHOOTING

### Error: "No streams found"
- ✅ Verifica que el título esté bien escrito
- ✅ Intenta sin el parámetro `year`
- ✅ Prueba con `language=español` o sin filtro de idioma

### Error: "Timeout" o tarda mucho
- ✅ Primera solicitud puede tardar 30-60s (server wake up)
- ✅ Puppeteer tarda 10-15s en scraping normal
- ✅ Cuevana a veces está lento o caído

### Error: "TMDB_KEY not found"
- ✅ Verifica que agregaste la variable de entorno en Render
- ✅ Formato correcto: `TMDB_KEY=a6510f4e165310dd55392863ed1ccd2b`

### Error en npm install local
- ✅ Es normal que tarde 5-10 minutos
- ✅ Puppeteer descarga Chromium (200+ MB)
- ✅ Deja que termine, no canceles

---

## 📝 ARCHIVOS IMPORTANTES

```
flixquest-api-custom/
├── src/
│   ├── providers/
│   │   └── cuevana.ts          ← Scraper de Cuevana con Puppeteer
│   ├── routes/
│   │   └── cuevana.ts          ← Endpoints del API
│   └── app.ts                  ← Registro de rutas
├── package.json                ← Dependencias (incluye Puppeteer)
├── render.yaml                 ← Config para Render
├── .env                        ← Variables de entorno (LOCAL)
└── CUEVANA_SETUP.md           ← Documentación completa
```

---

## 🎉 RESULTADO ESPERADO

Una vez desplegado, tendrás:

1. ✅ API funcionando en: `https://TU-URL.onrender.com`
2. ✅ Scraping de Cuevana con audio **Latino** y **Español**
3. ✅ Respuestas JSON con links de streaming
4. ✅ Gratis y funcional 24/7 (con sleep de 15 min)

**URL de ejemplo:**
```
https://flixquest-api-cuevana.onrender.com/cuevana/watch-movie?title=Joker&year=2019&language=latino
```

¡Listo para desplegar! 🚀
