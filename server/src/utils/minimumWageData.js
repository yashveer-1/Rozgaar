// Minimum wage data based on official state labor notifications (approx. 2025/2026 rates)
// Standardizing into daily rates (in INR).
export const minimumWages = {
  'Rajasthan': {
    'Unskilled': { daily: 285, monthly: 7410 },
    'Semi-skilled': { daily: 297, monthly: 7722 },
    'Skilled': { daily: 309, monthly: 8034 },
    'Highly Skilled': { daily: 359, monthly: 9334 }
  },
  'Delhi': {
    'Unskilled': { daily: 673, monthly: 17494 },
    'Semi-skilled': { daily: 740, monthly: 19215 },
    'Skilled': { daily: 814, monthly: 21215 }
  },
  'Maharashtra': {
    'Unskilled': { daily: 410, monthly: 10660 },
    'Semi-skilled': { daily: 460, monthly: 11960 },
    'Skilled': { daily: 520, monthly: 13520 }
  },
  'Karnataka': {
    'Unskilled': { daily: 382, monthly: 9932 },
    'Semi-skilled': { daily: 432, monthly: 11232 },
    'Skilled': { daily: 482, monthly: 12532 }
  },
  'Uttar Pradesh': {
    'Unskilled': { daily: 395, monthly: 10270 },
    'Semi-skilled': { daily: 445, monthly: 11570 },
    'Skilled': { daily: 495, monthly: 12870 }
  },
  'Tamil Nadu': {
    'Unskilled': { daily: 360, monthly: 9360 },
    'Semi-skilled': { daily: 410, monthly: 10660 },
    'Skilled': { daily: 460, monthly: 11960 }
  },
  'West Bengal': {
    'Unskilled': { daily: 397, monthly: 10322 },
    'Semi-skilled': { daily: 437, monthly: 11362 },
    'Skilled': { daily: 480, monthly: 12480 }
  }
};

// Map typical worker occupations to skill levels
export const occupationSkillMapping = {
  'Tailoring': 'Semi-skilled',
  'Embroidery': 'Semi-skilled',
  'Stitching': 'Semi-skilled',
  'Carpentry': 'Skilled',
  'Plumbing': 'Skilled',
  'Electrical': 'Skilled',
  'Cooking': 'Semi-skilled',
  'Driving': 'Skilled',
  'Welding': 'Skilled',
  'Masonry': 'Skilled',
  'Painting': 'Skilled',
  'Photography': 'Skilled',
  'Data Entry': 'Skilled',
  'Teaching': 'Highly Skilled',
  'Nursing': 'Highly Skilled'
};

export function getMinimumWage(state, occupation) {
  const normState = Object.keys(minimumWages).find(
    k => k.toLowerCase() === (state || '').trim().toLowerCase()
  ) || 'Rajasthan';
  
  const stateData = minimumWages[normState];
  const skillCategory = occupationSkillMapping[occupation] || 'Unskilled';
  const wages = stateData[skillCategory] || stateData['Unskilled'];
  
  return {
    skillCategory,
    daily: wages.daily,
    monthly: wages.monthly,
    hourly: Math.round(wages.daily / 8) // Standard 8-hour workday
  };
}
