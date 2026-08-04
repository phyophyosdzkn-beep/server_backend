export default async function handler(req, res) {
  // POST request မဟုတ်ရင် ပိတ်မည်
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Android App ကနေ ပို့လိုက်တဲ့ data တွေကို ယူမယ်
    const { prompt, systemInstruction, apiKey } = req.body;

    // App ကနေ API key မပါလာရင် Vercel environment variable က key ကို သုံးမယ်
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return res.status(401).json({ error: 'API Key မရှိပါ။ Vercel Environment Variables တွင် GEMINI_API_KEY ကို ထည့်ပါ သို့မဟုတ် App မှ ပေးပို့ပါ။' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt မပါဝင်ပါ။' });
    }

    // Gemini API ကို လှမ်းခေါ်ရန် Payload တည်ဆောက်ခြင်း
    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
      requestPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    // Gemini API သို့ တိုက်ရိုက် HTTP request ပို့ခြင်း
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    // Gemini ဆီက ပြန်လာတဲ့ စာသားကို ယူခြင်း
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Android App ကို ပြန်ပို့ပေးခြင်း
    return res.status(200).json({ text: generatedText });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
