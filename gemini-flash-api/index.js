// Import library yang diperlukan
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

// buat variable app untuk express
const app = express();

// buat variable upload untuk multer
const upload = multer();

// buat variable untuk akses GoogleGenAi
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});

// buat variable gemini model yang akan digunakan
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

// Kita akan jalankan di local PORT 3000
const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// endpoint POST untuk generate text /generate-text
app.post('/generate-text', async(req, res) => {
    const { prompt } = req.body;

    try {
        // variable response berisi content yang digenerate oleh gemini
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        res.status(200).json({ result: response.text })
    } catch(e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
})

// Endpoint untuk menerima permintaan generate-from-image.
// upload.single("image") digunakan untuk menangani upload file tunggal dengan field name "image".
app.post("/generate-from-image", upload.single("image"), async (req, res) => {

    // Mengambil prompt teks dari body request.
    const { prompt } = req.body;

    // Mengubah buffer file gambar yang di-upload menjadi format Base64.
    const base64Image = req.file.buffer.toString("base64");

    try {
        // Memanggil model AI untuk melakukan generate konten berdasarkan prompt + gambar.
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,  // Nama model AI yang digunakan.
            contents: [
                { 
                    text: prompt,      // Prompt teks dari user.
                    type: "text"      
                },
                {
                    // Inline data gambar yang dikirim ke model.
                    inlineData: { 
                        data: base64Image,           // Data gambar dalam Base64.
                        mimeType: req.file.mimetype  // MIME type gambar (jpeg/png/dll).
                    }
                },
            ],
        });
        // Jika sukses, kirim hasil text dari AI ke client.
        res.status(200).json({ result: response.text });

    } catch (e) {
        // Jika terjadi error, log di server dan kirim pesan error ke client.
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

// ===============================
// Generate dari Document (PDF/DOC/DLL)
// ===============================
app.post("/generate-from-document", upload.single("document"), async (req, res) => {
    // Mengambil prompt dari body.
    const { prompt } = req.body;

    // Mengubah file dokumen menjadi Base64.
    const base64Document = req.file.buffer.toString("base64");

    try {
        // Memanggil model AI untuk merangkum atau memproses dokumen.
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    // Jika user tidak memberi prompt, fallback ke pesan default.
                    text: prompt ?? "Tolong buat ringkasan dari dokumen berikut secara rinci.",
                    type: "text",
                },
                {
                    // Data dokumen dalam Base64.
                    inlineData: {
                        data: base64Document,
                        mimeType: req.file.mimetype,
                    },
                },
            ],
        });

        // Mengirim hasil text dari AI.
        res.status(200).json({ result: response.text });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});


// ===============================
// Generate dari Audio (MP3/WAV/DLL)
// ===============================
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {

    // Mengambil prompt dari body.
    const { prompt } = req.body;

    // Mengubah file audio menjadi Base64.
    const base64Audio = req.file.buffer.toString("base64");

    try {
        // Memanggil model AI untuk membuat transkrip atau memproses audio.
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    // Jika user tidak memberi prompt, gunakan default transkrip.
                    text: prompt ?? "Tolong buatkan transkrip dari rekaman berikut.",
                    type: "text",
                },
                {
                    // Data audio dalam Base64.
                    inlineData: {
                        data: base64Audio,
                        mimeType: req.file.mimetype,
                    },
                },
            ],
        });

        // Mengirim hasil text dari AI.
        res.status(200).json({ result: response.text });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

