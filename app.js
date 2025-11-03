const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let chatHistory = [];

app.use((req, res, next) => {
    console.log('\n--- REQUEST ---');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Raw body:', req.body ? JSON.stringify(req.body) : 'empty');
    next();
});

app.get('/', (req, res) => {
    console.log('Rendering homepage with', chatHistory.length, 'messages');
    res.render('index', { 
        title: 'AI Chatbot',
        chatHistory: chatHistory
    });
});

app.post('/chat', async (req, res) => {
    console.log('=== POST /chat handler ===');
    console.log('typeof req.body:', typeof req.body);
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body:', req.body);
    console.log('req.body.message:', req.body.message);
    
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === '') {
        console.log('Empty message detected');
        chatHistory.push({ 
            role: 'assistant', 
            content: '⚠️ Pesan kosong terdeteksi. Silakan ketik sesuatu!' 
        });
        return res.redirect('/');
    }

    console.log('Processing message:', userMessage);
    chatHistory.push({ role: 'user', content: userMessage });

    try {
        console.log('Calling OpenAI API...');
        const aiResponse = await callOpenAI(userMessage);
        console.log('AI Response received');
        
        chatHistory.push({ role: 'assistant', content: aiResponse });
        res.redirect('/');
    } catch (error) {
        console.error('Error:', error.message);
        
        let errorMessage = '❌ Terjadi kesalahan: ';
        
        if (error.response) {
            if (error.response.status === 429) {
                errorMessage += 'Quota API habis atau terlalu banyak request. Cek https://platform.openai.com/usage';
            } else if (error.response.status === 401) {
                errorMessage += 'API key tidak valid';
            } else {
                errorMessage += error.response.data?.error?.message || 'Error dari OpenAI';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMessage += 'Tidak dapat terhubung ke OpenAI. Cek koneksi internet.';
        } else {
            errorMessage += error.message;
        }
        
        chatHistory.push({ role: 'assistant', content: errorMessage });
        res.redirect('/');
    }
});

app.post('/clear', (req, res) => {
    console.log('Clearing chat history');
    chatHistory = [];
    res.redirect('/');
});

async function callOpenAI(message) {
    const axios = require('axios');
    
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY tidak ditemukan di file .env');
    }

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-3.5-turbo',
            messages: [
                { 
                    role: 'system', 
                    content: 'Kamu adalah asisten AI yang membantu dan ramah. Jawab dalam bahasa Indonesia kecuali user bertanya dalam bahasa lain.' 
                },
                { 
                    role: 'user', 
                    content: message 
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );

    return response.data.choices[0].message.content;
}

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log('\n=================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Node version: ${process.version}`);
    console.log(`Visit: http://localhost:${PORT}`);
    console.log('=================================\n');
});