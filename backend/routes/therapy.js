const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided' 
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'psychemirror-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    });
  }
};

// Save therapy assessment
router.post('/assessment', verifyToken, async (req, res) => {
  try {
    const { 
      interviewAnswers, 
      psychologicalAssessment, 
      disorderDetected, 
      therapyPlan,
      analysisResult 
    } = req.body;

    const userId = req.user.userId;

    // Save assessment to database
    const assessmentResult = await pool.query(
      `INSERT INTO therapy_assessments 
       (user_id, interview_answers, psychological_assessment, disorder_detected, therapy_plan, analysis_result, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [
        userId,
        JSON.stringify(interviewAnswers),
        JSON.stringify(psychologicalAssessment),
        JSON.stringify(disorderDetected),
        JSON.stringify(therapyPlan),
        JSON.stringify(analysisResult)
      ]
    );

    const assessmentId = assessmentResult.rows[0].id;

    res.json({
      success: true,
      assessmentId,
      message: 'Therapy assessment saved successfully'
    });

  } catch (error) {
    console.error('Error saving therapy assessment:', error);
    res.status(500).json({
      error: 'Failed to save therapy assessment',
      message: error.message
    });
  }
});

// Helper function to safely parse JSON (handles both string and object)
const safeJsonParse = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  // If it's already an object, return it
  if (typeof value === 'object') {
    return value;
  }
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Failed to parse JSON string:', value);
      return null;
    }
  }
  return value;
};

// Get therapy assessment history
router.get('/assessments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('=== FETCHING THERAPY ASSESSMENTS ===');
    console.log('User ID:', userId);

    const result = await pool.query(
      `SELECT id, interview_answers, psychological_assessment, disorder_detected, 
              therapy_plan, analysis_result, created_at
       FROM therapy_assessments 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log('Raw assessments from DB:', result.rows.length);

    const assessments = result.rows.map((row, index) => {
      try {
        console.log(`Processing assessment ${index + 1}:`, {
          id: row.id,
          interview_answers_type: typeof row.interview_answers,
          psychological_assessment_type: typeof row.psychological_assessment,
          therapy_plan_type: typeof row.therapy_plan
        });

        const assessment = {
          id: row.id,
          interviewAnswers: safeJsonParse(row.interview_answers),
          psychologicalAssessment: safeJsonParse(row.psychological_assessment),
          disorderDetected: safeJsonParse(row.disorder_detected),
          therapyPlan: safeJsonParse(row.therapy_plan),
          analysisResult: safeJsonParse(row.analysis_result),
          createdAt: row.created_at
        };

        console.log(`Assessment ${index + 1} processed successfully`);
        return assessment;
      } catch (parseError) {
        console.error(`Error parsing assessment ${index + 1}:`, parseError);
        console.error('Row data:', row);
        // Return a minimal assessment object to prevent complete failure
        return {
          id: row.id,
          interviewAnswers: {},
          psychologicalAssessment: {},
          disorderDetected: null,
          therapyPlan: { activities: [] },
          analysisResult: null,
          createdAt: row.created_at
        };
      }
    });

    console.log('Processed assessments:', assessments.length);

    res.json({
      success: true,
      assessments
    });

  } catch (error) {
    console.error('Error fetching therapy assessments:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch therapy assessments',
      message: error.message
    });
  }
});

// Save therapy session
router.post('/session', verifyToken, async (req, res) => {
  try {
    const { 
      activityId, 
      activityName, 
      duration, 
      completed, 
      progress,
      notes 
    } = req.body;

    const userId = req.user.userId;

    console.log('=== SAVING THERAPY SESSION ===');
    console.log('User ID:', userId);
    console.log('Activity ID:', activityId);
    console.log('Activity Name:', activityName);
    console.log('Completed:', completed);
    console.log('Progress:', progress);
    console.log('Duration:', duration);

    const result = await pool.query(
      `INSERT INTO therapy_activities 
       (user_id, activity_id, activity_name, duration, completed, progress, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, activity_id, activity_name, completed, created_at`,
      [userId, activityId, activityName, duration, completed, progress, notes]
    );

    const savedSession = result.rows[0];
    console.log('Session saved successfully:', savedSession);

    res.json({
      success: true,
      sessionId: savedSession.id,
      activityId: savedSession.activity_id,
      activityName: savedSession.activity_name,
      completed: savedSession.completed,
      createdAt: savedSession.created_at,
      message: 'Therapy session saved successfully'
    });

  } catch (error) {
    console.error('Error saving therapy session:', error);
    res.status(500).json({
      error: 'Failed to save therapy session',
      message: error.message
    });
  }
});

// Get therapy session history
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    console.log('=== FETCHING THERAPY SESSIONS ===');
    console.log('User ID:', userId);
    console.log('Limit:', limit, 'Offset:', offset);

    const result = await pool.query(
      `SELECT id, activity_id, activity_name, duration, completed, progress, notes, created_at
       FROM therapy_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    console.log('Raw sessions from DB:', result.rows.length);
    result.rows.forEach((row, index) => {
      console.log(`Session ${index + 1}:`, {
        id: row.id,
        activity_id: row.activity_id,
        activity_name: row.activity_name,
        completed: row.completed,
        created_at: row.created_at
      });
    });

    const sessions = result.rows.map(row => ({
      id: row.id,
      activityId: row.activity_id,
      activityName: row.activity_name,
      duration: row.duration,
      completed: row.completed,
      progress: row.progress,
      notes: row.notes,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
    }));

    console.log('Processed sessions:', sessions.length);
    const completedSessions = sessions.filter(s => s.completed);
    console.log('Completed sessions:', completedSessions.length);
    completedSessions.forEach(s => {
      console.log('Completed:', s.activityId, s.activityName, s.createdAt);
    });

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM therapy_activities WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      sessions,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching therapy sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch therapy sessions',
      message: error.message
    });
  }
});

// Get therapy progress summary
router.get('/progress', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get session statistics
    const sessionStats = await pool.query(
      `SELECT 
         COUNT(*) as total_sessions,
         COUNT(CASE WHEN completed = true THEN 1 END) as completed_sessions,
         AVG(CASE WHEN completed = true THEN duration END) as avg_duration,
         SUM(CASE WHEN completed = true THEN duration END) as total_duration
       FROM therapy_activities 
       WHERE user_id = $1`,
      [userId]
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT activity_name, created_at, completed, progress
       FROM therapy_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    // Get mood trends (if available)
    const moodTrends = await pool.query(
      `SELECT DATE(created_at) as date, AVG(progress) as avg_progress
       FROM therapy_activities 
       WHERE user_id = $1 AND completed = true
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [userId]
    );

    const stats = sessionStats.rows[0];
    const completionRate = stats.total_sessions > 0 
      ? (stats.completed_sessions / stats.total_sessions * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      progress: {
        totalSessions: parseInt(stats.total_sessions),
        completedSessions: parseInt(stats.completed_sessions),
        completionRate: parseFloat(completionRate),
        averageDuration: parseFloat(stats.avg_duration || 0),
        totalDuration: parseFloat(stats.total_duration || 0),
        recentActivity: recentActivity.rows,
        moodTrends: moodTrends.rows
      }
    });

  } catch (error) {
    console.error('Error fetching therapy progress:', error);
    res.status(500).json({
      error: 'Failed to fetch therapy progress',
      message: error.message
    });
  }
});

// Update therapy plan
router.put('/plan/:assessmentId', verifyToken, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { therapyPlan } = req.body;
    const userId = req.user.userId;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM therapy_assessments WHERE id = $1 AND user_id = $2',
      [assessmentId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Assessment not found',
        message: 'Therapy assessment not found or access denied'
      });
    }

    const result = await pool.query(
      'UPDATE therapy_assessments SET therapy_plan = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(therapyPlan), assessmentId]
    );

    res.json({
      success: true,
      message: 'Therapy plan updated successfully'
    });

  } catch (error) {
    console.error('Error updating therapy plan:', error);
    res.status(500).json({
      error: 'Failed to update therapy plan',
      message: error.message
    });
  }
});

// Get therapy day and progress tracking
router.get('/tracking', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get therapy day (count of days with at least one completed session)
    const dayResult = await pool.query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as therapy_days
       FROM therapy_activities 
       WHERE user_id = $1 AND completed = true`,
      [userId]
    );

    // Get sessions completed today
    const todayResult = await pool.query(
      `SELECT COUNT(*) as sessions_today
       FROM therapy_activities 
       WHERE user_id = $1 AND completed = true AND DATE(created_at) = CURRENT_DATE`,
      [userId]
    );

    // Get total sessions completed
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total_sessions
       FROM therapy_activities 
       WHERE user_id = $1 AND completed = true`,
      [userId]
    );

    // Get therapy plan progress
    const planResult = await pool.query(
      `SELECT therapy_plan
       FROM therapy_assessments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    let planProgress = 0;
    if (planResult.rows.length > 0) {
      try {
        const planData = planResult.rows[0].therapy_plan;
        const plan = safeJsonParse(planData);
        if (plan && plan.activities) {
          const totalExpectedSessions = plan.activities.length * 7; // 7 days per week
          planProgress = Math.min((totalResult.rows[0].total_sessions / totalExpectedSessions) * 100, 100);
        } else {
          // Use a default calculation if plan is invalid
          planProgress = Math.min((totalResult.rows[0].total_sessions / 10) * 100, 100);
        }
      } catch (parseError) {
        console.error('Error parsing therapy plan:', parseError);
        // Use a default calculation if parsing fails
        planProgress = Math.min((totalResult.rows[0].total_sessions / 10) * 100, 100);
      }
    }

    res.json({
      success: true,
      tracking: {
        therapyDay: parseInt(dayResult.rows[0].therapy_days) + 1, // +1 for current day
        sessionsToday: parseInt(todayResult.rows[0].sessions_today),
        totalSessions: parseInt(totalResult.rows[0].total_sessions),
        planProgress: Math.round(planProgress)
      }
    });

  } catch (error) {
    console.error('Error fetching therapy tracking:', error);
    res.status(500).json({
      error: 'Failed to fetch therapy tracking',
      message: error.message
    });
  }
});

// Get therapy recommendations based on emotional state
router.post('/recommendations', verifyToken, async (req, res) => {
  try {
    const { emotion, confidence, severity } = req.body;
    const userId = req.user.userId;

    // Get user's therapy history
    const historyResult = await pool.query(
      `SELECT activity_name, completed, progress, created_at
       FROM therapy_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    const history = historyResult.rows;

    // Generate recommendations based on emotion and history
    let recommendations = [];

    if (emotion === 'sad' || emotion === 'depressed') {
      recommendations.push({
        activity: 'gratitude',
        name: 'Gratitude Practice',
        reason: 'Focus on positive aspects to improve mood',
        priority: 'high'
      });
      recommendations.push({
        activity: 'music_therapy',
        name: 'Music Therapy',
        reason: 'Use uplifting music to regulate emotions',
        priority: 'medium'
      });
    } else if (emotion === 'anxious' || emotion === 'stressed') {
      recommendations.push({
        activity: 'breathing',
        name: 'Deep Breathing Exercise',
        reason: 'Activate parasympathetic nervous system',
        priority: 'high'
      });
      recommendations.push({
        activity: 'mindfulness',
        name: 'Mindfulness Meditation',
        reason: 'Reduce anxiety and improve focus',
        priority: 'high'
      });
    } else if (emotion === 'angry' || emotion === 'frustrated') {
      recommendations.push({
        activity: 'progressive_relaxation',
        name: 'Progressive Muscle Relaxation',
        reason: 'Release physical tension and anger',
        priority: 'high'
      });
      recommendations.push({
        activity: 'breathing',
        name: 'Deep Breathing Exercise',
        reason: 'Calm the nervous system',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        activity: 'mindfulness',
        name: 'Mindfulness Meditation',
        reason: 'Maintain emotional balance',
        priority: 'medium'
      });
    }

    // Adjust based on severity
    if (severity === 'severe') {
      recommendations.forEach(rec => {
        rec.priority = 'high';
        rec.reason += ' - Immediate attention recommended';
      });
    }

    // Consider user's history
    const completedActivities = history
      .filter(session => session.completed)
      .map(session => session.activity_name);

    recommendations = recommendations.map(rec => ({
      ...rec,
      recentlyUsed: completedActivities.includes(rec.name),
      suggestedDuration: rec.priority === 'high' ? 15 : 10
    }));

    res.json({
      success: true,
      recommendations,
      basedOn: {
        emotion,
        confidence,
        severity,
        historyLength: history.length
      }
    });

  } catch (error) {
    console.error('Error generating therapy recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate therapy recommendations',
      message: error.message
    });
  }
});

module.exports = router;