import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fetch from "node-fetch";
import { Configuration, OpenAIApi } from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Ruta para resumir texto
app.post("/api/resumir", async (req, res) => {
  const { texto, compacto } = req.body;

  if (!texto) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  const prompt = compacto
    ? `Resumí el siguiente texto lo más posible, sin superar una hoja, manteniendo las ideas clave:\n\n${texto}`
    : `Hacé un resumen con los puntos principales del siguiente texto:\n\n${texto}`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const resumen = completion.data.choices[0].message.content;
    res.json({ resumen });
  } catch (err) {
    console.error("Error al generar resumen:", err.message);
    res.status(500).json({ error: "No se pudo generar el resumen" });
  }
});

// Ruta para extraer texto desde archivo
app.post("/api/extraer-texto-archivo", upload.single("archivo"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    let texto = "";

    if (mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      texto = data.text;
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const data = await mammoth.extractRawText({ path: filePath });
      texto = data.value;
    } else {
      return res.status(400).json({ error: "Formato de archivo no soportado" });
    }

    fs.unlinkSync(filePath); // Limpia el archivo temporal
    res.json({ texto });
  } catch (err) {
    console.error("Error al procesar archivo:", err.message);
    res.status(500).json({ error: "No se pudo procesar el archivo" });
  }
});

// Ruta para extraer texto desde URL (opcional)
app.post("/api/extraer-texto-url", async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(url);
    const html = await response.text();
    const texto = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 10000);
    res.json({ texto });
  } catch (err) {
    console.error("Error al procesar URL:", err.message);
    res.status(500).json({ error: "No se pudo extraer contenido de la URL" });
  }
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor activo en http://localhost:${PORT}`));
