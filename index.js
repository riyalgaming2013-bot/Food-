const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// ==============================================================================
// 🚀 CONFIGURATION SECTION (सब कुछ यहाँ सेटअप कर दिया गया है)
// ==============================================================================
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyB6kI84eSjPf663XMAowzMZVasMdWHrsI0',
    BASE44_API_KEY: '7a5a5b938bdf491a89eefbbc6b92e100',
    BASE44_APP_ID: '69d1118bb56f25dea7d5618b',
    BASE44_BASE_URL: 'https://app.base44.com'
};

// Base44 Order Endpoint (Entities/Order)
const BASE44_ORDER_URL = `${CONFIG.BASE44_BASE_URL}/api/apps/${CONFIG.BASE44_APP_ID}/entities/Order`;
// ==============================================================================

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(), // GitHub Actions के लिए session save रखेगा
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage'
        ],
    }
});

// QR Code Generator
client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Base44 Food Bot is now Online!');
});

// Function to extract data using Gemini
async function extractOrderDetails(userText) {
    const prompt = `
    You are an order extraction bot for Base44 Food Delivery.
    Extract the following details from the user's message:
    1. item_name (The food item)
    2. quantity (The number of items)
    3. address (The delivery location)

    Return ONLY a valid JSON object. If any field is missing, set it to null.
    
    User message: "${userText}"
    
    Example format:
    {"item_name": "Pizza", "quantity": 1, "address": "Sector 15, Noida"}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Cleaning JSON from markdown code blocks
        const cleanJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Gemini Extraction Error:', error);
        return null;
    }
}

// Main Message Listener
client.on('message', async (msg) => {
    console.log(`📩 Message from ${msg.from}: ${msg.body}`);

    // 1. Gemini से डेटा निकालें
    const orderData = await extractOrderDetails(msg.body);

    if (!orderData || !orderData.item_name || !orderData.address) {
        return msg.reply("नमस्ते! कृपया अपना ऑर्डर सही से लिखें।\nउदाहरण: 'मुझे 2 बर्गर चाहिए, मेरा पता हाउस नं 12, दिल्ली है।'");
    }

    try {
        // 2. Base44 API पर डेटा भेजें (Post Request)
        const response = await axios.post(BASE44_ORDER_URL, orderData, {
            headers: {
                'api_key': CONFIG.BASE44_API_KEY, // आपके JS example के अनुसार
                'Content-Type': 'application/json'
            }
        // अगर Base44 ने आपको कोई object दिया है, तो उसे यहाँ पेस्ट करें।
// उदाहरण: const base44Config = { apiKey: 'XYZ123', endpoint: 'https://...' };
const base44Config = {
    // 👇 यहाँ अपना Base44 वाला पूरा JS कोड/ऑब्जेक्ट पेस्ट करें
    // JavaScript Example: Reading Entities
// Filterable fields: name, description, category, image_url, rating, delivery_time, delivery_fee, min_order, address, is_open, owner_email, cuisine_tags
async function fetchRestaurantEntities() {
    const response = await fetch(`/api/apps/69d1118bb56f25dea7d5618b/entities/Restaurant`, {
        headers: {
            'api_key': '7a5a5b938bdf491a89eefbbc6b92e100', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: name, description, category, image_url, rating, delivery_time, delivery_fee, min_order, address, is_open, owner_email, cuisine_tags
async function updateRestaurantEntity(entityId, updateData) {
    const response = await fetch(`/api/apps/69d1118bb56f25dea7d5618b/entities/Restaurant/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7a5a5b938bdf491a89eefbbc6b92e100', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}

        if (response.status === 200 || response.status === 201) {
            // 3. यूजर को कन्फर्मेशन भेजें
            const confirmation = `✅ *ऑर्डर सफलतापूर्वक दर्ज हो गया है!*\n\n🍔 *आइटम:* ${orderData.item_name}\n🔢 *मात्रा:* ${orderData.quantity}\n📍 *पता:* ${orderData.address}\n\nहम जल्द ही आपसे संपर्क करेंगे!`;
            msg.reply(confirmation);
            console.log('✅ Order saved to Base44 Dashboard');
        }
    } catch (error) {
        console.error('Base44 API Error:', error.response ? error.response.data : error.message);
        msg.reply("❌ माफ़ करें, सिस्टम में कुछ समस्या है। कृपया थोड़ी देर बाद प्रयास करें।");
    }
});

client.initialize();
