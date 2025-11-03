const express = require('express');
const router = express.Router();
const axios = require('axios');

let chatHistory = [];

// Route untuk halaman utama
router.get('/', (req, res) => {
    console.log('GET / - Loading homepage');
    console.log('Chat history length:', chatHistory.length);
    
    res.render('index', { 
        title: 'AI Chatbot',
        chatHistory: chatHistory
    });
});

// Route untuk mengirim pesan
router.post('/chat', async (req, res) => {
    console.log('POST /chat - Received');
    console.log('Request body:', req.body);
    
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === '') {
        console.log('Empty message, redirecting...');
        return res.redirect('/');
    }

    console.log('User message:', userMessage);
    chatHistory.push({ role: 'user', content: userMessage });

    try {
        console.log('Calling OpenAI API...');
        const aiResponse = await callOpenAI(userMessage);
        console.log('AI Response:', aiResponse);
        
        chatHistory.push({ role: 'assistant', content: aiResponse });
        console.log('Redirecting to homepage...');
        res.redirect('/');
    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        
        let errorMessage = 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
        
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            
            if (error.response.status === 429) {
                errorMessage = '⚠️ Terlalu banyak permintaan atau quota API habis. Silakan:\n1. Tunggu beberapa menit\n2. Periksa quota di platform.openai.com/usage\n3. Pastikan billing sudah diatur';
            } else if (error.response.status === 401) {
                errorMessage = '🔑 API key tidak valid. Silakan periksa API key Anda di file .env';
            } else if (error.response.status === 500) {
                errorMessage = '🔧 Server OpenAI sedang bermasalah. Silakan coba lagi nanti.';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '🌐 Tidak dapat terhubung ke server OpenAI. Periksa koneksi internet Anda.';
        }
        
        chatHistory.push({ role: 'assistant', content: errorMessage });
        res.redirect('/');
    }
});

// Route untuk clear history
router.post('/clear', (req, res) => {
    console.log('POST /clear - Clearing chat history');
    chatHistory = [];
    res.redirect('/');
});

// Fungsi untuk memanggil OpenAI API
async function callOpenAI(message) {
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

module.exports = router;