# Changelog - FlixQuest API Cuevana

## 🎯 Cambios Recientes

### ✅ Extractores de URLs Directas (Última actualización)

**Problema:** La API devolvía URLs de iframes HTML (ej: `https://pelistop.co/embed-xxx.html`) que el reproductor Flutter no podía reproducir.

**Solución:** Agregamos extractores que obtienen las URLs de video directas (MP4/M3U8) de dentro de los iframes.

#### Extractores Implementados:

1. **UQLoad** (`uqload.com`)
   - Extrae el archivo de video directo desde el JavaScript embebido
   - Patrón: `sources: [{ file: "URL_AQUI" }]`

2. **Doodstream** (`dood.to`)
   - Sistema basado en tokens
   - Hace petición secundaria a `/pass_md5/TOKEN` para obtener URL

3. **Streamtape** (`streamtape.com`)
   - Extrae ID y token del HTML
   - Construye URL: `https://streamtape.com/get_video?id=X&token=Y`

#### Cómo Funciona:

```typescript
// Antes (devolvía iframe):
{
  "url": "https://uqload.com/embed-abc123.html",
  "quality": "Reproductor 1"
}

// Ahora (devuelve video directo):
{
  "url": "https://uqload.com/i/abc/v.mp4",
  "quality": "Reproductor 1"
}
```

#### Próximos Extractores a Agregar:

- [ ] jawcloud.co
- [ ] pelistop.co
- [ ] embed.mystream.to
- [ ] fastplay.to

#### Testing:

```bash
# Probar la API
curl "https://flixquest-api-cuevana.onrender.com/cuevana/watch-movie?title=Joker&year=2019&language=latino"

# Debería devolver URLs que empiecen con algo así:
# - https://uqload.com/i/...
# - https://dood.to/d/...
# - https://streamtape.com/get_video?...
```

## 📝 Historial de Versiones

### v2.0 - Extractores de URLs Directas
- Agregados extractores para UQLoad, Doodstream, Streamtape
- Fallback a iframe si no se puede extraer URL directa

### v1.0 - Release Inicial
- Scraping de Cuevana3.to con Puppeteer
- Soporte para películas y series
- Filtros de idioma: latino, español, subtitulado
- Bypass automático de Cloudflare
