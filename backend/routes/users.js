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

// Get all users (for doctors)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Only doctors can view all users
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only doctors can view all users' 
      });
    }

    const result = await pool.query(
      `SELECT id, email, name, phone, role, specialization, experience, 
              created_at, last_active, last_mood 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        createdAt: user.created_at,
        lastActive: user.last_active,
        lastMood: user.last_mood
      }))
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users' 
    });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're a doctor
    if (req.user.userId !== parseInt(id) && req.user.role !== 'doctor') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only view your own profile' 
      });
    }

    const result = await pool.query(
      `SELECT id, email, name, phone, role, specialization, experience, 
              created_at, last_active, last_mood 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        createdAt: user.created_at,
        lastActive: user.last_active,
        lastMood: user.last_mood
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user' 
    });
  }
});

// Get user profile with extended information
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're a doctor
    if (req.user.userId !== parseInt(id) && req.user.role !== 'doctor') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only view your own profile' 
      });
    }

    const result = await pool.query(
      `SELECT id, email, name, phone, role, specialization, experience, 
              COALESCE(profile_picture, '') as profile_picture, 
              date_of_birth, 
              COALESCE(gender, '') as gender, 
              COALESCE(address, '') as address, 
              COALESCE(emergency_contact, '') as emergency_contact, 
              COALESCE(medical_history, '') as medical_history, 
              created_at, last_active, last_mood 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      specialization: user.specialization,
      experience: user.experience,
      profile_picture: user.profile_picture,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      address: user.address,
      emergency_contact: user.emergency_contact,
      medical_history: user.medical_history,
      created_at: user.created_at,
      last_active: user.last_active,
      last_mood: user.last_mood
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching profile' 
    });
  }
});

// Update user profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, phone, specialization, experience, profile_picture, 
      date_of_birth, gender, address, emergency_contact, medical_history 
    } = req.body;

    // Users can only update their own profile
    if (req.user.userId !== parseInt(id)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only update your own profile' 
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone),
           specialization = COALESCE($3, specialization),
           experience = COALESCE($4, experience),
           profile_picture = COALESCE($5, profile_picture),
           date_of_birth = COALESCE($6, date_of_birth),
           gender = COALESCE($7, gender),
           address = COALESCE($8, address),
           emergency_contact = COALESCE($9, emergency_contact),
           medical_history = COALESCE($10, medical_history),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING id, email, name, phone, role, specialization, experience, 
                 profile_picture, date_of_birth, gender, address, 
                 emergency_contact, medical_history, updated_at`,
      [name, phone, specialization, experience, profile_picture, 
       date_of_birth, gender, address, emergency_contact, medical_history, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        profile_picture: user.profile_picture,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        emergency_contact: user.emergency_contact,
        medical_history: user.medical_history,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile' 
    });
  }
});

// Get user statistics (for doctors)
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    // Only doctors can view statistics
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only doctors can view statistics' 
      });
    }

    // Get total patients
    const patientsResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = $1',
      ['patient']
    );

    // Get total doctors
    const doctorsResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = $1',
      ['doctor']
    );

    // Get recent registrations (last 7 days)
    const recentResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\''
    );

    // Get active users (last 24 hours)
    const activeResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE last_active >= NOW() - INTERVAL \'24 hours\''
    );

    res.json({
      stats: {
        totalPatients: parseInt(patientsResult.rows[0].total),
        totalDoctors: parseInt(doctorsResult.rows[0].total),
        recentRegistrations: parseInt(recentResult.rows[0].total),
        activeUsers: parseInt(activeResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching statistics' 
    });
  }
});

// Get all patients for doctor
router.get('/patients', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Verify user is a doctor
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userResult.rows[0].role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctor role required.' });
    }
    
    // Get all patients
    const patientsResult = await pool.query(
      'SELECT id, name, email, phone, created_at FROM users WHERE role = $1 ORDER BY name',
      ['patient']
    );
    
    res.json(patientsResult.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
