import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import * as fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/resumir', async (req, res) => {
  const { texto, compacto } = req.body;
  const prompt = compacto
    ? `Resumí el siguiente texto lo más posible, sin superar una hoja, manteniendo las ideas clave:\n\n${texto}`
    : `Hacé un resumen con los puntos principales del siguiente texto:\n\n${texto}`;
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });
    const resumen = completion.data.choices[0].message.content;
    res.json({ resumen });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error al generar resumen' });
  }
});

app.post('/api/extraer-texto-archivo', upload.single('archivo'), async (req, res) => {
  try {
    const filePath = req.file.path;
    let texto = "";
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      texto = data.text;
    } else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.mimetype === 'application/msword'
    ) {
      const data = await mammoth.extractRawText({ path: filePath });
      texto = data.value;
    } else {
      return res.status(400).json({ error: 'Formato de archivo no soportado' });
    }
    fs.unlinkSync(filePath);
    res.json({ texto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo procesar el archivo' });
  }
});

app.post('/api/extraer-texto-url', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(url);
    const html = await response.text();
    const textOnly = html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').slice(0, 10000);
    res.json({ texto: textOnly });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo extraer contenido de la URL' });
  }
});

app.listen(3001, () => console.log('Servidor en http://localhost:3001'));
