export type LeadBucket = 'Hot' | 'Warm' | 'Average' | 'Cold';

export interface ScoringResult {
  score: number;
  bucket: LeadBucket;
  reasons: string[];
}

export const mapScoreToBucket = (score: number): LeadBucket => {
  if (score >= 81) return 'Hot';
  if (score >= 61) return 'Warm';
  if (score >= 31) return 'Average';
  return 'Cold';
};

export const computeLeadScore = (lead: any): ScoringResult => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Base by lead stage
  const stage = (lead['lead stage'] || '').toLowerCase();
  if (stage === 'hot') {
    score += 35;
    reasons.push('Base: Hot stage (+35)');
  } else if (stage === 'warm') {
    score += 25;
    reasons.push('Base: Warm stage (+25)');
  } else if (stage === 'cold') {
    score += 10;
    reasons.push('Base: Cold stage (+10)');
  } else {
    score += 15;
    reasons.push('Base: Neutral stage (+15)');
  }

  // 2. Intent keywords in concern/summary
  const text = `${lead.concern || ''} ${lead['Conversation Summary'] || ''}`.toLowerCase();
  if (/price|cost|fee|charges|rate|insurance|cghs/i.test(text)) {
    score += 15;
    reasons.push('Intent: Pricing/Insurance inquiry (+15)');
  }
  if (/appointment|book|opd|consultation|visit|schedule/i.test(text)) {
    score += 18;
    reasons.push('Intent: Appointment request (+18)');
  }
  if (/surgery|operation|procedure|angioplasty|transplant|treatment/i.test(text)) {
    score += 12;
    reasons.push('Intent: Procedure inquiry (+12)');
  }
  if (/urgent|emergency|immediate|severe|critical|pain|attack/i.test(text)) {
    score += 12;
    reasons.push('Intent: Emergency/Urgency (+12)');
  }

  // 3. Specialist/department identified
  const hasSpecialist = /cardiol|orthoped|neurol|gynaecol|pediatr|urolog|gastro|pulmon|oncol|dermatol/i.test(text);
  const hasMedicalConcern = /stone|cancer|diabetes|sugar|blood pressure|heart|spine|joint|kidney|liver|lung|tumor/i.test(text);

  if (hasSpecialist) {
    score += 8;
    reasons.push('Data: Specialist identified (+8)');
  } else {
    score -= 5;
    reasons.push('Missing: Specialist not identified (-5)');
  }

  if (hasMedicalConcern) {
    score += 10;
    reasons.push('Data: Medical concern clear (+10)');
  }

  // 4. Sentiment
  const sentiment = (lead.sentiment || '').toLowerCase();
  if (sentiment.includes('pos')) {
    score += 6;
    reasons.push('Sentiment: Positive (+6)');
  } else if (sentiment.includes('neg')) {
    score -= 10;
    reasons.push('Sentiment: Negative (-10)');
  }

  // Final Clamp
  const finalScore = Math.max(0, Math.min(100, score));
  
  return {
    score: finalScore,
    bucket: mapScoreToBucket(finalScore),
    reasons
  };
};
