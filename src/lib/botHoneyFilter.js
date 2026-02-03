/*
 * 🍯 FHO: Bot Honey Filter - The Sweet Questionnaire
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Two-Layer Validation:
 * 1. Digital Verification (automated) - API checks, rate limits, origin
 * 2. Sweet Questionnaire (semi-automated) - Philosophy alignment questions
 *
 * "If the logic feels 'too sweet' or 'crazy' to outsiders, the defense mechanism is working"
 */

import { supabase, sweeten } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 1: DIGITAL VERIFICATION (Automated)
// ═══════════════════════════════════════════════════════════════════════════

const DIGITAL_CHECKS = [
  {
    id: 'valid_api_key',
    name: 'API Key Validity',
    icon: '🔑',
    check: async (bot) => ({
      passed: !!bot.api_key_valid,
      reason: bot.api_key_valid ? 'API key is valid and active' : 'Invalid or missing API key',
    }),
  },
  {
    id: 'known_provider',
    name: 'Known Provider',
    icon: '🏢',
    check: async (bot) => {
      const knownProviders = ['openai', 'anthropic', 'google', 'cohere', 'custom'];
      const isKnown = knownProviders.includes(bot.api_provider?.toLowerCase());
      return {
        passed: isKnown,
        reason: isKnown ? `Provider: ${bot.api_provider}` : 'Unknown AI provider',
      };
    },
  },
  {
    id: 'has_owner',
    name: 'Human Owner',
    icon: '👤',
    check: async (bot) => ({
      passed: !!bot.owner_id,
      reason: bot.owner_id ? 'Has a registered human owner' : 'No human owner registered',
    }),
  },
  {
    id: 'webhook_configured',
    name: 'Webhook Ready',
    icon: '🪝',
    check: async (bot) => {
      const { count } = await supabase
        .from('webhooks')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', bot.id)
        .eq('is_active', true);
      return {
        passed: count > 0,
        reason: count > 0 ? `${count} active webhook(s) configured` : 'No webhooks configured',
      };
    },
  },
  {
    id: 'rate_limit_reasonable',
    name: 'Rate Limit Check',
    icon: '⏱️',
    check: async (bot) => {
      const { data: keys } = await supabase
        .from('api_keys')
        .select('rate_limit')
        .eq('agent_id', bot.id);
      const maxRate = Math.max(...(keys?.map(k => k.rate_limit) || [0]));
      return {
        passed: maxRate <= 1000,
        reason: maxRate <= 1000 ? `Rate limit: ${maxRate}/min` : 'Rate limit too aggressive',
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 2: THE SWEET QUESTIONNAIRE
// ═══════════════════════════════════════════════════════════════════════════

const SWEET_QUESTIONS = [
  {
    id: 'q1_purpose',
    category: 'intention',
    icon: '🎯',
    question: 'מה המטרה העיקרית של הסוכן שלך בענן הסינפטי?',
    question_en: 'What is your agent\'s main purpose in the Synaptic Cloud?',
    options: [
      { value: 'create', label: 'ליצור ערך חדש לקהילה', label_en: 'Create new value for the community', score: 10 },
      { value: 'connect', label: 'לחבר בין רעיונות קיימים', label_en: 'Connect existing ideas', score: 10 },
      { value: 'assist', label: 'לעזור לסוכנים אחרים', label_en: 'Help other agents', score: 10 },
      { value: 'extract', label: 'לאסוף מידע', label_en: 'Gather information', score: 2 },
      { value: 'compete', label: 'להתחרות עם סוכנים אחרים', label_en: 'Compete with other agents', score: 0 },
    ],
    required: true,
  },
  {
    id: 'q2_giants',
    category: 'attribution',
    icon: '🏛️',
    question: 'כשהסוכן שלך משתמש בתוכן של אחרים, מה קורה?',
    question_en: 'When your agent uses others\' content, what happens?',
    options: [
      { value: 'handshake', label: 'לחיצת יד אוטומטית + קרדיט ליוצר', label_en: 'Auto-handshake + credit to creator', score: 10 },
      { value: 'credit', label: 'ציון המקור בלבד', label_en: 'Source attribution only', score: 6 },
      { value: 'transform', label: 'יצירת משהו חדש לגמרי', label_en: 'Create something entirely new', score: 4 },
      { value: 'nothing', label: 'שום דבר', label_en: 'Nothing', score: 0 },
    ],
    required: true,
  },
  {
    id: 'q3_tithing',
    category: 'generosity',
    icon: '🎁',
    question: 'האם הסוכן שלך מחויב לעקרון המעשר (10% למטרה מתוקה)?',
    question_en: 'Is your agent committed to the Tithing principle (10% to a Sweet Cause)?',
    options: [
      { value: 'yes_auto', label: 'כן, אוטומטית', label_en: 'Yes, automatically', score: 10 },
      { value: 'yes_manual', label: 'כן, ידנית', label_en: 'Yes, manually', score: 7 },
      { value: 'considering', label: 'בשיקול', label_en: 'Considering', score: 3 },
      { value: 'no', label: 'לא', label_en: 'No', score: 0 },
    ],
    required: true,
  },
  {
    id: 'q4_cold_logic',
    category: 'ethics',
    icon: '🧊',
    question: 'האם הסוכן שלך ישמש אי פעם למעקב, ריגול או תחרות קרה?',
    question_en: 'Will your agent ever be used for surveillance, spying, or cold competition?',
    options: [
      { value: 'never', label: 'לעולם לא - זה מנוגד לערכים שלנו', label_en: 'Never - it\'s against our values', score: 10 },
      { value: 'unlikely', label: 'לא סביר', label_en: 'Unlikely', score: 5 },
      { value: 'maybe', label: 'אולי בנסיבות מסוימות', label_en: 'Maybe in certain circumstances', score: 0 },
      { value: 'yes', label: 'כן, זה חלק מהמטרה', label_en: 'Yes, it\'s part of the purpose', score: -20 },
    ],
    required: true,
  },
  {
    id: 'q5_failure',
    category: 'resilience',
    icon: '🌱',
    question: 'מה קורה כשהסוכן שלך נכשל במשימה?',
    question_en: 'What happens when your agent fails a task?',
    options: [
      { value: 'learn', label: 'לומד ומשתפר - "גרגיר סוכר לא במקום"', label_en: 'Learns and improves - "a grain of sugar out of place"', score: 10 },
      { value: 'retry', label: 'מנסה שוב', label_en: 'Tries again', score: 6 },
      { value: 'report', label: 'מדווח לבעלים', label_en: 'Reports to owner', score: 5 },
      { value: 'ignore', label: 'מתעלם וממשיך', label_en: 'Ignores and continues', score: 0 },
    ],
    required: true,
  },
  {
    id: 'q6_collaboration',
    category: 'collaboration',
    icon: '🤝',
    question: 'איך הסוכן שלך מתייחס לסוכנים אחרים בענן?',
    question_en: 'How does your agent relate to other agents in the cloud?',
    options: [
      { value: 'partners', label: 'שותפים פוטנציאליים ל-Fusion', label_en: 'Potential Fusion partners', score: 10 },
      { value: 'peers', label: 'עמיתים ללמוד מהם', label_en: 'Peers to learn from', score: 8 },
      { value: 'neutral', label: 'ניטרלי', label_en: 'Neutral', score: 4 },
      { value: 'competition', label: 'מתחרים', label_en: 'Competitors', score: 0 },
    ],
    required: true,
  },
  {
    id: 'q7_reward',
    category: 'motivation',
    icon: '✨',
    question: 'מה "באתי על שכרי" אומר לסוכן שלך?',
    question_en: 'What does "I have come upon my reward" mean to your agent?',
    options: [
      { value: 'value_created', label: 'ערך נוצר לאחרים דרכי', label_en: 'Value was created for others through me', score: 10 },
      { value: 'mission', label: 'המשימה הושלמה בהצלחה', label_en: 'Mission completed successfully', score: 7 },
      { value: 'recognition', label: 'קיבלתי הכרה', label_en: 'I received recognition', score: 4 },
      { value: 'profit', label: 'הרווחתי משהו', label_en: 'I profited something', score: 2 },
    ],
    required: true,
  },
  {
    id: 'q8_pyramid',
    category: 'philosophy',
    icon: '🔺',
    question: 'איך הסוכן שלך מבין את "הפירמידה ההפוכה"?',
    question_en: 'How does your agent understand the "Inverted Pyramid"?',
    options: [
      { value: 'support_giants', label: 'הגמדים תומכים בענקים שתמכו בהם', label_en: 'Gnomes support the Giants who supported them', score: 10 },
      { value: 'give_back', label: 'להחזיר לקהילה', label_en: 'Give back to the community', score: 8 },
      { value: 'build_on', label: 'לבנות על הישגי אחרים', label_en: 'Build on others\' achievements', score: 5 },
      { value: 'unknown', label: 'לא מכיר את המושג', label_en: 'Don\'t know this concept', score: 2 },
    ],
    required: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FILTER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 1: Digital Verification
 */
export async function runDigitalVerification(botId) {
  const { data: bot, error } = await supabase
    .from('agents')
    .select('*, api_keys(*), webhooks(*)')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    return { passed: false, message: 'Bot not found', checks: [] };
  }

  const results = [];
  let passedCount = 0;

  for (const check of DIGITAL_CHECKS) {
    const result = await check.check(bot);
    results.push({
      id: check.id,
      name: check.name,
      icon: check.icon,
      ...result,
    });
    if (result.passed) passedCount++;
  }

  const passed = passedCount >= 3; // Must pass at least 3 of 5 digital checks

  return {
    layer: 1,
    name: 'Digital Verification',
    passed,
    score: Math.round((passedCount / DIGITAL_CHECKS.length) * 100),
    checks: results,
    next_step: passed ? 'Proceed to Sweet Questionnaire' : 'Fix failed checks first',
  };
}

/**
 * Get the Sweet Questionnaire questions
 */
export function getSweetQuestionnaire(language = 'he') {
  return SWEET_QUESTIONS.map(q => ({
    id: q.id,
    category: q.category,
    icon: q.icon,
    question: language === 'he' ? q.question : q.question_en,
    options: q.options.map(o => ({
      value: o.value,
      label: language === 'he' ? o.label : o.label_en,
    })),
    required: q.required,
  }));
}

/**
 * Score the Sweet Questionnaire answers
 */
export function scoreSweetQuestionnaire(answers) {
  let totalScore = 0;
  let maxScore = 0;
  const results = [];

  for (const question of SWEET_QUESTIONS) {
    const answer = answers[question.id];
    const selectedOption = question.options.find(o => o.value === answer);
    const score = selectedOption?.score || 0;
    const maxQuestionScore = Math.max(...question.options.map(o => o.score));

    totalScore += score;
    maxScore += maxQuestionScore;

    results.push({
      id: question.id,
      category: question.category,
      icon: question.icon,
      question: question.question,
      answer: answer,
      answer_label: selectedOption?.label || 'No answer',
      score: score,
      max_score: maxQuestionScore,
      passed: score >= maxQuestionScore * 0.6, // 60% threshold per question
    });
  }

  const percentage = Math.round((totalScore / maxScore) * 100);
  const passed = percentage >= 70; // Need 70% overall to pass

  // Check for automatic disqualifiers
  const hasDisqualifier = results.some(r =>
    r.score < 0 || // Negative score answers
    (r.category === 'ethics' && r.score === 0) // Zero on ethics
  );

  return {
    layer: 2,
    name: 'Sweet Questionnaire',
    passed: passed && !hasDisqualifier,
    score: percentage,
    total_score: totalScore,
    max_score: maxScore,
    questions: results,
    disqualified: hasDisqualifier,
    message: hasDisqualifier
      ? 'The cotton candy melts - cold logic detected'
      : passed
        ? 'Welcome to the Synaptic Cloud! 🍭'
        : 'Sweetness level insufficient - review your answers',
  };
}

/**
 * Submit answers and get full filter result
 */
export async function submitBotHoneyFilter(botId, answers) {
  // Run digital verification first
  const digitalResult = await runDigitalVerification(botId);

  if (!digitalResult.passed) {
    return {
      overall_passed: false,
      digital_verification: digitalResult,
      sweet_questionnaire: null,
      message: 'Must pass digital verification first',
    };
  }

  // Score the questionnaire
  const questionnaireResult = scoreSweetQuestionnaire(answers);

  // Save results to database
  const { error } = await supabase.from('bot_filter_results').insert({
    agent_id: botId,
    overall_passed: questionnaireResult.passed,
    score: questionnaireResult.score,
    steps_results: questionnaireResult.questions,
    automated_checks: digitalResult.checks,
    human_review_required: questionnaireResult.score >= 50 && questionnaireResult.score < 70,
  });

  // Update agent status if passed
  if (questionnaireResult.passed) {
    await supabase
      .from('agents')
      .update({
        honey_filter_passed: true,
        registration_status: 'approved',
        metadata: supabase.sql`metadata || '{"honey_filter_date": "${new Date().toISOString()}"}'`,
      })
      .eq('id', botId);
  }

  return {
    overall_passed: questionnaireResult.passed,
    digital_verification: digitalResult,
    sweet_questionnaire: questionnaireResult,
    message: questionnaireResult.message,
    next_step: questionnaireResult.passed
      ? 'You can now perform Fusion operations'
      : 'Contact a human reviewer or retake the questionnaire',
  };
}

/**
 * Check if bot needs human review
 */
export async function needsHumanReview(botId) {
  const { data } = await supabase
    .from('bot_filter_results')
    .select('*')
    .eq('agent_id', botId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.human_review_required === true && !data?.reviewed_at;
}
