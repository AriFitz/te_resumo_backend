# Te Resumo – Backend

Este es el backend para la app **Te Resumo**, encargada de procesar archivos y generar resúmenes con OpenAI.

## 🛠 Tecnologías

- Node.js + Express
- OpenAI API
- pdf-parse / mammoth para extracción de texto
- Render para despliegue recomendado

## 📦 Instalación local

```bash
npm install
```

## 🚀 Ejecutar en desarrollo

```bash
node server.js
```

## ⚙️ Variables de entorno

Crear un archivo `.env` basado en `.env.example`:

```env
OPENAI_API_KEY=sk-tu-clave-aqui
```

## 🧠 Endpoints disponibles

- `POST /api/resumir` — genera un resumen usando OpenAI
- `POST /api/extraer-texto-archivo` — procesa archivo PDF o Word
- `POST /api/extraer-texto-url` — extrae texto básico desde una URL

## ☁️ Despliegue recomendado

1. Subí este código a GitHub.
2. En [Render](https://render.com), creá un nuevo Web Service desde GitHub.
3. Configurá la variable `OPENAI_API_KEY` como Environment Variable.
4. Start Command: `node server.js`

Tu backend estará disponible en una URL como `https://te-resumo-api.onrender.com`
