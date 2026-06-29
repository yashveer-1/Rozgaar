const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function askGemini(task, profile) {
  if (!process.env.GEMINI_API_KEY) return { configured: false, message: 'AI service is not configured' };
  const prompt = `You are a livelihood assistant for Indian informal workers. Be factual, concise and never invent eligibility or financial scores.
Task: ${task}
Worker profile: ${JSON.stringify(profile)}
Return valid JSON with an explanation and actionable recommendations.`;
  const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
  });
  if (!response.ok) throw new Error('AI provider request failed');
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}
