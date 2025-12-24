const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get chat messages for a relationship
router.get('/messages/:relationshipId', verifyToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Verify user has access to this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND (doctor_id = $2 OR patient_id = $2)`,
      [relationshipId, userId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    const messagesResult = await pool.query(`
      SELECT 
        cm.*,
        sender.name as sender_name,
        sender.profile_picture as sender_profile_picture,
        receiver.name as receiver_name
      FROM chat_messages cm
      JOIN users sender ON cm.sender_id = sender.id
      JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE cm.relationship_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [relationshipId, limit, offset]);

    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages SET is_read = true WHERE relationship_id = $1 AND receiver_id = $2`,
      [relationshipId, userId]
    );

    res.json({
      success: true,
      messages: messagesResult.rows.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messagesResult.rows.length
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat messages',
      message: error.message
    });
  }
});

// Send a chat message
router.post('/messages', verifyToken, async (req, res) => {
  try {
    const { relationshipId, message, messageType = 'text' } = req.body;
    const senderId = req.user.userId;

    // Verify user has access to this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND (doctor_id = $2 OR patient_id = $2)`,
      [relationshipId, senderId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    const relationship = relationshipResult.rows[0];
    
    // Only allow messages for active relationships
    if (relationship.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Cannot send messages',
        message: 'The relationship must be active to send messages. Please wait for the doctor to accept your request.'
      });
    }
    
    const receiverId = relationship.doctor_id === senderId ? relationship.patient_id : relationship.doctor_id;

    // Insert message
    const messageResult = await pool.query(`
      INSERT INTO chat_messages 
      (sender_id, receiver_id, relationship_id, message, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [senderId, receiverId, relationshipId, message, messageType]);

    const newMessage = messageResult.rows[0];

    // Get sender info
    const senderResult = await pool.query(
      `SELECT name, profile_picture FROM users WHERE id = $1`,
      [senderId]
    );

    const sender = senderResult.rows[0];

    // Create notification for receiver
    await pool.query(`
      INSERT INTO notifications 
      (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
    `, [receiverId, 'New Message', `You have received a new message from ${sender.name}`, 'chat_message']);

    res.json({
      success: true,
      message: {
        ...newMessage,
        sender_name: sender.name,
        sender_profile_picture: sender.profile_picture
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get unread message count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCountResult = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM chat_messages cm
      JOIN doctor_patient_relationships dpr ON cm.relationship_id = dpr.id
      WHERE cm.receiver_id = $1 AND cm.is_read = false
    `, [userId]);

    res.json({
      success: true,
      unreadCount: parseInt(unreadCountResult.rows[0].unread_count)
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      message: error.message
    });
  }
});

// Mark messages as read
router.put('/messages/:relationshipId/read', verifyToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND (doctor_id = $2 OR patient_id = $2)`,
      [relationshipId, userId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    await pool.query(
      `UPDATE chat_messages SET is_read = true WHERE relationship_id = $1 AND receiver_id = $2`,
      [relationshipId, userId]
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
      message: error.message
    });
  }
});

module.exports = router;
