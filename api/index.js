import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { prompt, systemInstruction, apiKey } = req.body;

    const authHeader = req.headers.authorization;
    let headerApiKey = req.headers["x-api-key"];
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerApiKey = authHeader.substring(7);
    }

    const finalApiKey = apiKey || headerApiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      return res.status(400).json({ error: "API key is required." });
    }

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      ...(systemInstruction && { systemInstruction })
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ text: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
