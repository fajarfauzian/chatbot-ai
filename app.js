const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    if (req.path !== '/favicon.ico' && !req.path.includes('.well-known')) {
        console.log('\n--- REQUEST ---');
        console.log('Method:', req.method);
        console.log('Path:', req.path);
    }
    next();
});

let chatHistory = [];

app.get('/', (req, res) => {
    console.log('Rendering homepage with', chatHistory.length, 'messages');
    res.render('index', { 
        title: 'AI Chatbot',
        chatHistory: chatHistory
    });
});

app.post('/api/chat', async (req, res) => {
    console.log('=== API /chat handler ===');
    
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === '') {
        return res.json({
            success: false,
            error: 'Pesan kosong'
        });
    }

    console.log('Processing message:', userMessage);
    chatHistory.push({ role: 'user', content: userMessage });

    try {
        console.log('Calling AI API...');
        const aiResponse = await callAI(userMessage);
        console.log('AI Response received');
        
        chatHistory.push({ role: 'assistant', content: aiResponse });
        
        res.json({
            success: true,
            response: aiResponse
        });
    } catch (error) {
        console.error('Error:', error.message);
        
        let errorMessage = 'Terjadi kesalahan: ' + error.message;
        chatHistory.push({ role: 'assistant', content: errorMessage });
        
        res.json({
            success: false,
            error: errorMessage
        });
    }
});

app.post('/api/clear', (req, res) => {
    console.log('Clearing chat history');
    chatHistory = [];
    res.json({
        success: true,
        message: 'Chat history cleared'
    });
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === '') {
        chatHistory.push({ 
            role: 'assistant', 
            content: '⚠️ Pesan kosong terdeteksi.' 
        });
        return res.redirect('/');
    }

    chatHistory.push({ role: 'user', content: userMessage });

    try {
        const aiResponse = await callAI(userMessage);
        chatHistory.push({ role: 'assistant', content: aiResponse });
        res.redirect('/');
    } catch (error) {
        chatHistory.push({ role: 'assistant', content: 'Error: ' + error.message });
        res.redirect('/');
    }
});

app.post('/clear', (req, res) => {
    chatHistory = [];
    res.redirect('/');
});

async function callAI(message) {

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        try {
            console.log('Trying OpenAI...');
            return await callOpenAI(message);
        } catch (error) {
            console.log('OpenAI failed:', error.response?.status, error.message);
            if (error.response?.status === 429) {
                console.log('OpenAI quota exceeded, trying fallback...');
            } else if (error.response?.status === 401) {
                console.log('OpenAI API key invalid, trying fallback...');
            } else {
                throw error;
            }
        }
    }
    
    console.log('Using mock AI response...');
    return getMockResponse(message);
}

async function callOpenAI(message) {
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

function getMockResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/^(hi|hello|halo|hey|hai|hola)/)) {
        return '👋 Halo! Selamat datang di AI Chatbot. Ada yang bisa saya bantu?\n\n💡 Tip: Chatbot ini sekarang menggunakan AJAX, jadi tidak perlu reload halaman!';
    }
    
    if (lowerMessage.match(/(apa kabar|how are you|how r u|kabar)/)) {
        return '😊 Saya baik-baik saja, terima kasih! Bagaimana dengan Anda?\n\nSenang bisa chat tanpa reload halaman kan? 🚀';
    }
    
    if (lowerMessage.match(/(help|bantuan|tolong|cara)/)) {
        return '📚 Saya adalah chatbot AI sederhana. Berikut cara menggunakan saya:\n\n✅ Ketik pertanyaan atau pesan\n✅ Tekan Enter atau klik "Kirim"\n✅ Chat langsung muncul tanpa reload!\n✅ Klik "Hapus Riwayat" untuk memulai dari awal\n\n🔧 Setup AI asli:\n1. Daftar di platform.openai.com\n2. Buat API key\n3. Tambahkan ke .env file\n4. Restart: npm start';
    }
    
    if (lowerMessage.match(/(fitur|feature|bisa apa|apa saja)/)) {
        return '✨ Fitur chatbot ini:\n\n🚀 Real-time chat tanpa reload\n💬 Respons AI yang cerdas\n🎨 UI modern dan responsif\n⚡ Typing indicator\n🗑️ Clear history\n📱 Mobile-friendly\n\n🔧 Mau upgrade? Hubungkan dengan OpenAI API untuk AI lebih pintar!';
    }
    
    if (lowerMessage.match(/(terima kasih|thank you|thanks|thx|makasih)/)) {
        return '🙏 Sama-sama! Senang bisa membantu. Ada lagi yang bisa saya bantu?';
    }
    
    if (lowerMessage.match(/(bye|dadah|sampai jumpa|selamat tinggal|goodbye)/)) {
        return '👋 Sampai jumpa! Semoga harimu menyenangkan! Jangan ragu untuk chat lagi ya! 😊';
    }
    
    if (lowerMessage.match(/(siapa nama|what is your name|your name|namamu)/)) {
        return '🤖 Saya adalah AI Chatbot, asisten virtual Anda!\n\nSaat ini saya berjalan dalam mode demo. Untuk percakapan yang lebih pintar, hubungkan saya dengan OpenAI API.\n\nSekarang dengan teknologi AJAX - chat tanpa reload! 🚀';
    }
    
    if (lowerMessage.match(/(jam berapa|waktu|tanggal|hari ini)/)) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return `🕐 Sekarang: ${now.toLocaleDateString('id-ID', options)} WIB\n\nChatbot ini sekarang real-time tanpa reload lho! ⚡`;
    }
    
    return `💬 Saya menerima pesan Anda: "${message}"\n\n⚡ Chat sekarang real-time tanpa reload!\n\n⚠️ Mode Demo Aktif\nSaat ini chatbot menggunakan respons sederhana.\n\n📝 Cara Setup OpenAI untuk AI lebih pintar:\n1. Buka https://platform.openai.com\n2. Login/daftar akun\n3. Buat API key di "API Keys"\n4. Tambahkan ke file .env:\n   OPENAI_API_KEY=sk-your-key-here\n5. Restart server: npm start\n\n💡 Coba tanya:\n- "help" - untuk bantuan\n- "fitur" - lihat fitur\n- "jam berapa" - cek waktu`;
}

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log('\n=================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
    console.log(`⚡ AJAX Mode: Chat tanpa reload!`);
    console.log('=================================');
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
        console.log('\n⚠️  OpenAI API key not configured');
        console.log('💡 Using demo responses');
        console.log('🔧 To use real AI: Add OPENAI_API_KEY to .env\n');
    } else {
        console.log('\n✅ OpenAI API key detected\n');
    }
});