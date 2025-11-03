const express = require('express');
const router = express.Router();
const axios = require('axios');

let chatHistory = [];

router.get('/', (req, res) => {
    res.render('index', { 
        title: 'AI Chatbot',
        chatHistory: chatHistory
    });
});

router.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    chatHistory.push({ role: 'user', content: userMessage });

    try {
      
        const aiResponse = await callOpenAI(userMessage);
        
        chatHistory.push({ role: 'assistant', content: aiResponse });

        res.redirect('/');
    } catch (error) {
        console.error('Error calling AI API:', error);
        chatHistory.push({ role: 'assistant', content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda.' });
        res.redirect('/');
    }
});

router.post('/clear', (req, res) => {
    chatHistory = [];
    res.redirect('/');
});

async function callOpenAI(message) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

async function callDeepSeek(message) {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

module.exports = router;