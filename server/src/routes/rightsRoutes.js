import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMinimumWage } from '../utils/minimumWageData.js';
import { askGemini } from '../services/aiService.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

export const rightsRoutes = Router();

rightsRoutes.get('/wage-check', authenticate, async (req, res, next) => {
  try {
    const { state, occupation, wage, unit = 'day' } = req.query;
    
    if (!state || !occupation || !wage) {
      return res.status(400).json({ message: 'State, occupation, and wage are required parameters' });
    }

    const parsedWage = parseFloat(wage);
    if (isNaN(parsedWage) || parsedWage <= 0) {
      return res.status(400).json({ message: 'Wage must be a positive number' });
    }

    const standardWages = getMinimumWage(state, occupation);
    
    // Normalize user wage to daily equivalent
    let userDailyWage = parsedWage;
    if (unit === 'hour') {
      userDailyWage = parsedWage * 8; // 8-hour workday standard
    } else if (unit === 'month') {
      userDailyWage = parsedWage / 26; // Approx 26 working days in a month
    }

    const minimumDailyWage = standardWages.daily;
    const isUnderpaid = userDailyWage < minimumDailyWage;
    
    // Calculate percentage difference
    const diff = userDailyWage - minimumDailyWage;
    const percentageDifference = Math.round((diff / minimumDailyWage) * 100);

    return res.json({
      state,
      occupation,
      skillCategory: standardWages.skillCategory,
      unit,
      userWageNormalizedDaily: Math.round(userDailyWage),
      minimumDailyWage,
      minimumMonthlyWage: standardWages.monthly,
      minimumHourlyWage: standardWages.hourly,
      isUnderpaid,
      percentageDifference
    });
  } catch (error) {
    return next(error);
  }
});

rightsRoutes.post('/dispute-letter', authenticate, async (req, res, next) => {
  try {
    const { employerName, startDate, endDate, unpaidAmount, description, language = 'en' } = req.body || {};
    
    if (!employerName || !unpaidAmount || !startDate) {
      return res.status(400).json({ message: 'Employer name, start date, and unpaid amount are required' });
    }

    const profile = await WorkerProfile.findOne({ user: req.user.sub }).lean();
    const workerName = req.user.name || 'a worker';

    const prompt = `You are a legal aid and worker support AI.
Draft a professional, formal, yet polite wage demand text message (suitable for WhatsApp or SMS) to be sent by the worker ${workerName} to their employer ${employerName}.

Details:
- Period of unpaid work: ${startDate} to ${endDate || 'present'}
- Unpaid wage amount: Rs. ${Number(unpaidAmount).toLocaleString('en-IN')}
- Description / details of work done: ${description || 'Contracted manual labor/services'}
- Action requested: Pay the outstanding amount within 3 days via bank transfer or UPI.
- Legal tone: Firm and respectful. Remind them gently of the payment agreement and state minimum wage protections in India where appropriate.

Provide the message in ${language === 'hi' ? 'Hindi (written in clean Devanagari script)' : 'clear English'}.
Do not include any JSON wrapping, HTML, markdown headers, bold headers like "**Subject:**", or system notes. Just output the raw message content that the worker can copy and send directly.`;

    const aiRes = await askGemini('chat', {
      profile,
      context: { request: prompt }
    });

    return res.json({
      letter: aiRes?.answer || aiRes?.message || 'Failed to generate dispute notice.'
    });
  } catch (error) {
    return next(error);
  }
});
