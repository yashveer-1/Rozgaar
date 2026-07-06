# SHRAMIK LENS – AI-Powered Digital Livelihood Passport

SHRAMIK LENS is a full-stack MERN application that empowers India's informal workforce by creating **Digital Livelihood Passports**. The platform enables workers to securely manage their professional identity, upload work-related documents, receive AI-powered career guidance, discover government welfare schemes, and connect with relevant employment opportunities.

---

## 🌟 Features

- 👤 **Digital Worker Profile**
  - Personal information
  - Skills & experience
  - Employment history
  - Languages & education
  - Profile completion tracking

- 📄 **Document Vault**
  - Secure document uploads
  - Cloudinary integration
  - OCR-based document processing
  - Document verification workflow

- 🤖 **AI-Powered Insights**
  - Google Gemini integration
  - Personalized skill recommendations
  - Career guidance
  - Government scheme recommendations
  - AI assistant for worker support

- 📊 **Income Analytics**
  - Monthly income dashboard
  - Income trends
  - Financial readiness score
  - Employment insights

- 💼 **Smart Job Matching**
  - AI-ranked job recommendations
  - Skill-based matching
  - Location-aware opportunities

- 🪪 **Digital Livelihood Passport**
  - QR-enabled worker profile
  - Verified skills & employment
  - Trust score
  - Shareable digital identity

- 🔐 **Authentication & Security**
  - JWT Authentication
  - Refresh Tokens
  - Protected APIs
  - Role-based access

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- React Query
- Framer Motion
- Recharts
- React Router
- Axios

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Socket.IO

## AI & Cloud

- Google Gemini API
- Cloudinary
- Tesseract OCR

## Deployment

- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas

---

# 📁 Project Structure

```
SHRAMIK-LENS/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── package.json
└── README.md
```

---

# 🚀 Running Locally

## Clone the repository

```bash
git clone https://github.com/yashveer-1/SHRAMIK-LENS.git
cd SHRAMIK-LENS
```

## Install dependencies

```bash
npm install
```

---

## Configure Environment Variables

Copy

```bash
cp server/.env.example server/.env
```

Update the values in `server/.env`

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

JWT_REFRESH_SECRET=

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:5173
```

---

## Start the application

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5000
```

---

# 🌐 Production Deployment

## Frontend

Vercel

```
https://rozgaar-client-ten.vercel.app
```

Environment Variable

```env
VITE_API_URL=https://rozgaar-vyxw.onrender.com/api
```

---

## Backend

Render

```
https://rozgaar-vyxw.onrender.com
```

Environment Variable

```env
CLIENT_URL=https://rozgaar-client-ten.vercel.app
```

---

# 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB Atlas connection string |
| JWT_SECRET | JWT access token secret |
| JWT_REFRESH_SECRET | JWT refresh token secret |
| GEMINI_API_KEY | Google Gemini API key |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| CLIENT_URL | Frontend URL |

---

# 📌 Core Modules

- Dashboard
- Digital Passport
- Income Insights
- Document Vault
- Job Matching
- Government Schemes
- Skills & Growth
- AI Assistant
- Worker Profile
- Authentication

---

# 🔮 Future Enhancements

- Multi-language support
- Employer Portal
- NGO Dashboard
- Aadhaar/eKYC Integration
- Offline-first PWA
- Mobile Application
- AI Resume Builder
- Interview Preparation
- Financial Inclusion Services

---

# 👨‍💻 Author

**Yashveer Singh**

GitHub: https://github.com/yashveer-1

LinkedIn: *(Add your LinkedIn URL here)*

---

# 📄 License

This project was developed as part of **Build for Good 2026** and is intended for educational, research, and social impact purposes.
