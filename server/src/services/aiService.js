const endpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function getSystemContext(lang) {
  let instruction = "Answer in English.";
  if (lang === 'hi' || lang === 'hindi') {
    instruction = "You MUST respond in Hindi (Devanagari script) only.";
  } else if (lang === 'hinglish') {
    instruction = "You MUST respond in Hinglish (mixed Hindi and English words using Latin/English script) only. E.g. 'Namaste! Aap PM Vishwakarma scheme ke liye eligible hain.'";
  } else if (lang === 'en' || lang === 'english') {
    instruction = "You MUST respond in English only.";
  }
  return `You are Lens AI, a helpful livelihood assistant for Indian informal workers on the Shramik Lens platform.
You have access to the worker's profile, income, and skill data. Be concise, warm, and practical.
${instruction}`;
}

function getMockAIResponse(task, data) {
  const isChat = task === 'chat';
  const userRequest = data?.context?.request || task;
  const profile = data?.profile || data || {};
  const userObj = profile.user || {};
  const workerName = userObj.name || profile.name || 'Worker';
  const occupation = profile.occupation || 'Tailoring';
  const skills = (profile.skills || []).map(s => s.name).join(', ') || 'Tailoring';
  
  const selectedLang = data?.context?.language || 'en';
  const isHindi = selectedLang === 'hi' || selectedLang === 'hindi';
  const isHinglish = selectedLang === 'hinglish';

  if (isChat) {
    const q = userRequest.toLowerCase();
    
    // Default Greetings
    let answer = `Namaste! I am Lens AI (running in local simulator mode). As a specialized assistant for informal workers, I can help you understand your alternative credit profile, rights, and job matches.`;
    if (isHindi) {
      answer = `नमस्ते! मैं लेंस एआई हूँ (सिम्युलेटर मोड)। अनौपचारिक श्रमिकों के लिए एक विशेष सहायक के रूप में, मैं आपकी क्रेडिट प्रोफ़ाइल, अधिकारों और नौकरी के मैचों को समझने में आपकी मदद कर सकता हूँ।`;
    } else if (isHinglish) {
      answer = `Namaste! Main Lens AI hoon (local simulator mode). Informal workers ke liye ek special assistant ke roop mein, main aapki credit profile, legal rights aur job matches samajhne mein help kar sakta hoon.`;
    }
    
    // Scheme Queries
    if (q.includes('scheme') || q.includes('yojana') || q.includes('eligib')) {
      if (isHindi) {
        answer = `आपके ${occupation} प्रोफ़ाइल और ${skills || 'कौशल'} के आधार पर, आप इन सरकारी योजनाओं के लिए पात्र हैं:
1. **पीएम विश्वकर्मा योजना**: ₹15,000 टूलकिट प्रोत्साहन + 5% ब्याज पर आसान व्यवसाय ऋण।
2. **प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)**: केवल ₹20/वर्ष में ₹2 लाख का दुर्घटना बीमा।
3. **प्रधानमंत्री श्रम योगी मानधन**: 60 वर्ष की आयु के बाद ₹3,000 मासिक पेंशन।
आप इन्हें सीधे 'Govt. Schemes' टैब में देख और आवेदन कर सकते हैं!`;
      } else if (isHinglish) {
        answer = `Aapke ${occupation} profile aur ${skills || 'skills'} ke hisab se, aap in government schemes ke liye eligible hain:
1. **PM Vishwakarma Scheme**: ₹15,000 toolkit incentive + 5% interest par low-interest business loans.
2. **PMSBY (Suraksha Bima Yojana)**: Sirf ₹20/year mein ₹2 Lakh ka accident insurance cover.
3. **PM Shram Yogi Maandhan**: Age 60 ke baad ₹3,000 monthly guaranteed pension.
Aap directly 'Govt. Schemes' tab mein jaakar apply kar sakte hain!`;
      } else {
        answer = `Based on your profile as a ${occupation} professional with skills in ${skills || 'your trade'}, you are eligible for:
1. **PM Vishwakarma Scheme**: Toolkit incentive of ₹15,000 + low-interest enterprise loans.
2. **PMSBY (Pradhan Mantri Suraksha Bima Yojana)**: ₹2 Lakh accidental insurance for just ₹20/year.
3. **PM Shram Yogi Maandhan**: Monthly pension of ₹3,000 after age 60.
You can view and apply for these directly in the 'Govt. Schemes' tab!`;
      }
    } 
    // Income Queries
    else if (q.includes('income') || q.includes('earn') || q.includes('kamai') || q.includes('trend')) {
      if (isHindi) {
        answer = `आपके आय विश्लेषण को देखते हुए:
- आपका सत्यापित लेनदेन इतिहास सक्रिय है।
- आपकी महीने-दर-महीने की वृद्धि एक स्थिर पैटर्न दर्शाती है।
- भुगतान के स्क्रीनशॉट के साथ अपने दस्तावेज़ वॉल्ट को अपडेट रखने से आपकी क्रेडिट रेटिंग मजबूत रहेगी।`;
      } else if (isHinglish) {
        answer = `Aapke income insights ko dekhte hue:
- Aapki verified transaction history active hai.
- Month-on-month earnings growth kaafi steady hai.
- Apne document vault mein payments ke screenshot upload karte rahein taaki alternative credit score strong bana rahe.`;
      } else {
        answer = `Looking at your income insights:
- Your verified transaction history is active.
- Your month-on-month growth indicates a steady pattern.
- Keeping your document vault updated with recent payment screenshots will help maintain a strong Livelihood Credit rating.`;
      }
    } 
    // Skills Queries
    else if (q.includes('skill') || q.includes('career') || q.includes('growth')) {
      if (isHindi) {
        answer = `आपके क्षेत्र (${profile.location?.city || 'आपके क्षेत्र'}) में कमाई बढ़ाने के लिए मेरी सलाह है:
1. **उन्नत प्रमाणपत्र** (जैसे राष्ट्रीय कौशल विकास प्रमाणपत्र)।
2. **अतिरिक्त कौशल**: मशीन मरम्मत जैसे सहायक काम सीखें।
इससे आपका जॉब मैच स्कोर और दैनिक मजदूरी 15-25% तक बढ़ सकती है।`;
      } else if (isHinglish) {
        answer = `Aapke city (${profile.location?.city || 'area'}) mein earning potential badhane ke liye tips:
1. **Advanced Certification** (jaise National Skill Development Council ka certificate NCR).
2. **Additional Skills**: Machine repair ya maintenance seekhein.
Isse aapka job match score aur daily income 15-25% tak badh sakti hai.`;
      } else {
        answer = `To increase your earning potential in ${profile.location?.city || 'your area'}, I recommend:
1. **Advanced Certification** (e.g. National Skill Development Certificate).
2. **Expanding core skills**: Adding secondary skills like Basic Machine Repair.
This can improve your job match score and expected daily rate by 15-25%.`;
      }
    } 
    // Trust Score Queries
    else if (q.includes('trust') || q.includes('readiness') || q.includes('score')) {
      if (isHindi) {
        answer = `अपने ट्रस्ट स्कोर और वित्तीय तैयारी रेटिंग में सुधार करने के लिए:
1. कम से कम 2 सत्यापित भुगतान पर्ची या UPI स्क्रीनशॉट अपलोड करें।
2. अनुभव की पुष्टि के लिए पूर्व नियोक्ताओं/ग्राहकों के संदर्भ जोड़ें।
3. प्रोफाइल पेज में सभी विवरण (बैंक खाता, पता, शिक्षा) पूरा भरें।`;
      } else if (isHinglish) {
        answer = `Apna Trust Score aur Financial Readiness rating improve karne ke liye:
1. Kam se kam 2 verified payment slips ya UPI screenshot upload karein.
2. Purane employers ya clients ke recommendation references add karein.
3. Profile page mein bank account, education aur complete address ki details fill karein.`;
      } else {
        answer = `To improve your Trust Score and Financial Readiness rating:
1. Upload at least 2 verified payment slips or UPI screenshots.
2. Add references (former employers/clients) to verify your experience.
3. Complete all fields in your Profile page (bank account, address, education).`;
      }
    } 
    // Wage Dispute Notices
    else if (q.includes('to be sent by the worker') || q.includes('draft a professional') || q.includes('wage demand')) {
      const employerMatch = userRequest.match(/employer\s+([A-Za-z0-9\s]+)/i) || userRequest.match(/employerName:\s*([A-Za-z0-9\s]+)/i);
      const employer = employerMatch ? employerMatch[1].trim() : 'Employer';
      const amountMatch = userRequest.match(/Rs\.\s+([0-9,]+)/i) || userRequest.match(/unpaidAmount:\s*([0-9,]+)/i);
      const amount = amountMatch ? amountMatch[1] : '8,500';
      const isHindiDispute = q.includes('hindi') || q.includes('devanagari');
      
      if (isHindiDispute) {
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
  const selectedLang = data?.context?.language || 'en';

  const prompt = isChat
    ? `${getSystemContext(selectedLang)}

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