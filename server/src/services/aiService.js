const endpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_CONTEXT = `You are Lens AI, a helpful livelihood assistant for Indian informal workers on the Shramik Lens platform.
You have access to the worker's profile, income, and skill data. Be concise, warm, and practical.
Answer in the same language the user asks in (English or Hindi).`;

function getMockAIResponse(task, data) {
  const isChat = task === 'chat';
  const userRequest = data?.context?.request || task;
  const profile = data?.profile || data || {};
  const userObj = profile.user || {};
  const workerName = userObj.name || profile.name || 'Worker';
  const occupation = profile.occupation || 'Tailoring';
  const skills = (profile.skills || []).map(s => s.name).join(', ') || 'Tailoring';

  if (isChat) {
    const q = userRequest.toLowerCase();
    let answer = `Namaste! I am Lens AI (running in local simulator mode). As a specialized assistant for informal workers, I can help you understand your alternative credit profile, rights, and job matches.`;
    
    if (q.includes('scheme') || q.includes('yojana') || q.includes('eligib')) {
      answer = `Based on your profile as a ${occupation} professional with skills in ${skills || 'your trade'}, you are eligible for:
1. **PM Vishwakarma Scheme**: Toolkit incentive of ₹15,000 + low-interest enterprise loans.
2. **PMSBY (Pradhan Mantri Suraksha Bima Yojana)**: ₹2 Lakh accidental insurance for just ₹20/year.
3. **PM Shram Yogi Maandhan**: Monthly pension of ₹3,000 after age 60.
You can view and apply for these directly in the 'Govt. Schemes' tab!`;
    } else if (q.includes('income') || q.includes('earn') || q.includes('kamai') || q.includes('trend')) {
      answer = `Looking at your income insights:
- Your verified transaction history is active.
- Your month-on-month growth indicates a steady pattern.
- Keeping your document vault updated with recent payment screenshots will help maintain a strong Livelihood Credit rating.`;
    } else if (q.includes('skill') || q.includes('career') || q.includes('growth')) {
      answer = `To increase your earning potential in ${profile.location?.city || 'your area'}, I recommend:
1. **Advanced Certification** (e.g. National Skill Development Certificate).
2. **Expanding core skills**: Adding secondary skills like Basic Machine Repair.
This can improve your job match score and expected daily rate by 15-25%.`;
    } else if (q.includes('trust') || q.includes('readiness') || q.includes('score')) {
      answer = `To improve your Trust Score and Financial Readiness rating:
1. Upload at least 2 verified payment slips or UPI screenshots.
2. Add references (former employers/clients) to verify your experience.
3. Complete all fields in your Profile page (bank account, address, education).`;
    } else if (q.includes('to be sent by the worker') || q.includes('draft a professional') || q.includes('wage demand')) {
      const employerMatch = userRequest.match(/employer\s+([A-Za-z0-9\s]+)/i) || userRequest.match(/employerName:\s*([A-Za-z0-9\s]+)/i);
      const employer = employerMatch ? employerMatch[1].trim() : 'Employer';
      const amountMatch = userRequest.match(/Rs\.\s+([0-9,]+)/i) || userRequest.match(/unpaidAmount:\s*([0-9,]+)/i);
      const amount = amountMatch ? amountMatch[1] : '8,500';
      const isHindi = q.includes('hindi') || q.includes('devanagari');
      
      if (isHindi) {
        answer = `नमस्ते,
यह संदेश मेरे बकाया काम के भुगतान के संबंध में है।

मेरे काम की कुल बकाया राशि ₹${amount} है। 

मैंने पूरी ईमानदारी और समय पर अपना काम पूरा किया है। आपसे विनम्र अनुरोध है कि कृपया इस बकाया राशि को अगले 3 दिनों के भीतर मेरे बैंक/UPI खाते में ट्रांसफर करने की कृपा करें। 

सहयोग के लिए धन्यवाद।
सादर,
${workerName}`;
      } else {
        answer = `Dear ${employer},

This is a formal request regarding my outstanding payment for the services completed. 

As per our agreement, the total unpaid wages amount to Rs. ${amount}. I kindly request you to settle this outstanding balance within the next 3 days via bank transfer or UPI.

Thank you for your prompt attention to this matter.

Sincerely,
${workerName}`;
      }
    } else if (q.includes('dispute') || q.includes('demand') || q.includes('unpaid') || q.includes('wage')) {
      answer = `If you have unpaid wages, I can help draft a professional demand notice. Please open the 'Rights & Safety' tab to input the employer name and unpaid amount, and I will generate a formal notice for you!`;
    }
    
    return { answer };
  } else {
    // Non-chat tasks (like skill recommendations structured JSON)
    return {
      recommended_skills: [
        { name: `Advanced ${occupation}`, relevance: "High local demand in market hubs" },
        { name: "Safety Training Certification", relevance: "Lowers premium rates for enterprise coverage" }
      ],
      recommended_certifications: [
        { name: `National Skill Development Certificate (${occupation})`, benefits: "Improves job match priority by 30%" }
      ],
      career_paths: [
        { name: `Production Lead / Master Craftsman`, skills_needed: `Quality Assurance, Supervisor training`, description: "Provides transition from contract daily wages to stable monthly salary" }
      ]
    };
  }
}

export async function askGemini(task, data) {
  if (!process.env.GEMINI_API_KEY) {
    return getMockAIResponse(task, data);
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