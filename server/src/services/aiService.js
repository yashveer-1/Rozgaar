const endpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_CONTEXT = `You are Lens AI, a helpful livelihood assistant for Indian informal workers on the Shramik Lens platform.
You have access to the worker's profile, income, and skill data. Be concise, warm, and practical.
Answer in the same language the user asks in (English or Hindi).`;

export async function askGemini(task, data) {
  if (!process.env.GEMINI_API_KEY) {
    return { configured: false, message: "AI service is not configured" };
  }

  const isChat = task === 'chat';
  const userRequest = data?.context?.request || task;
  const profile = data?.profile || data;

  const prompt = isChat
    ? `${SYSTEM_CONTEXT}

Worker Profile (use this context to personalise your answer):
${JSON.stringify(profile, null, 2)}

User's question: ${userRequest}

Respond in plain conversational text (no JSON, no markdown headers). Be helpful and specific to this worker's profile.`
    : `You are a livelihood assistant for Indian informal workers.

Task: ${userRequest}

Worker Profile:
${JSON.stringify(profile)}

Return ONLY valid JSON.`;

  try {
    const response = await fetch(
      `${endpoint}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: isChat
            ? { temperature: 0.7, maxOutputTokens: 1024 }
            : { responseMimeType: "application/json" },
        }),
      }
    );

    const responseBody = await response.text();
    console.log("Gemini status:", response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return isChat
          ? { answer: "I'm a bit busy right now — quota exceeded. Please try again in a minute." }
          : { recommendations: [], message: "Gemini API quota exceeded. Please try again later." };
      }
      return isChat
        ? { answer: `AI service error (${response.status}). Please try again.` }
        : { recommendations: [], message: `AI error ${response.status}.` };
    }

    const data2 = JSON.parse(responseBody);
    const text = data2.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return isChat
        ? { answer: "Sorry, I couldn't generate a response. Please try again." }
        : { recommendations: [], message: "Unable to parse AI response." };
    }

    if (isChat) return { answer: text.trim() };

    return JSON.parse(text);
  } catch (err) {
    console.error("AI service error:", err);
    return isChat
      ? { answer: "I'm temporarily offline. Please try again in a moment." }
      : { recommendations: [], message: "AI recommendations offline. Please try again later." };
  }
}