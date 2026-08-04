// Vercel Serverless Function for Gemini Movie Recap Relay (BYOK Support)
export default async function handler(req, res) {
  // CORS Headers (APK မှ တိုက်ရိုက် ခေါ်ယူနိုင်ရန်)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-key'
  );

  // OPTIONS Request ကို လက်ခံခြင်း (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
  }

  try {
    const { prompt, systemInstruction, apiKey } = req.body;

    // App မှ Headers သို့မဟုတ် Body ထဲပါလာသော Key ကို ရယူခြင်း
    const userApiKey = apiKey || req.headers['x-api-key'] || process.env.GEMINI_API_KEY;

    if (!userApiKey) {
      return res.status(400).json({ 
        error: 'Gemini API Key မပါရှိပါ။ ကျေးဇူးပြု၍ APK ၏ Settings တွင် API Key ထည့်သွင်းပါ။' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt စာသား ပါရှိခြင်း မရှိပါ။' });
    }

    // Google Gemini API သို့ သွားရောက် ခေါ်ယူခြင်း
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${userApiKey}`;

    const requestPayload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      requestPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', data);
      return res.status(geminiResponse.status).json({
        error: data.error?.message || 'Gemini API မှ တုံ့ပြန်မှု အမှား ရရှိပါသည်။'
      });
    }

    // တုံ့ပြန်မှု စာသားကို သန့်စင်၍ အကြောင်းပြန်ခြင်း
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      text: textOutput,
      result: textOutput,
      candidates: data.candidates
    });

  } catch (error) {
    console.error('Server Relay Error:', error);
    return res.status(500).json({ 
      error: `Internal Server Error: ${error.message}` 
    });
  }
}
