const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const NotificationService = require('../modules/notifications_module/services/NotificationService');

const notificationService = new NotificationService();

// Get all notifications for the current user (from both tables for backward compatibility)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const options = {
      unreadOnly: req.query.unreadOnly === 'true',
      type: req.query.type,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    // Get notifications from enhanced table
    const enhancedNotifications = await notificationService.getUserNotifications(userId, options);

    // Also get notifications from old table for backward compatibility
    let oldNotificationsQuery = `
      SELECT 
        id,
        user_id,
        title,
        message,
        type,
        'in_app' as channel,
        'medium' as severity,
        NULL as emotion_data,
        is_read,
        false as is_delivered,
        0 as delivery_attempts,
        created_at,
        NULL as delivered_at
      FROM notifications
      WHERE user_id = $1
    `;
    const oldValues = [userId];

    if (options.unreadOnly) {
      oldNotificationsQuery += ' AND is_read = false';
    }

    if (options.type) {
      oldNotificationsQuery += ' AND type = $2';
      oldValues.push(options.type);
    }

    oldNotificationsQuery += ' ORDER BY created_at DESC';

    if (options.limit) {
      oldNotificationsQuery += ` LIMIT $${oldValues.length + 1}`;
      oldValues.push(options.limit);
    }

    const oldNotificationsResult = await pool.query(oldNotificationsQuery, oldValues);
    const oldNotifications = oldNotificationsResult.rows;

    // Merge both lists, removing duplicates (by id if they exist in both)
    const allNotifications = [...enhancedNotifications];
    const enhancedIds = new Set(enhancedNotifications.map(n => n.id));
    
    oldNotifications.forEach(oldNotif => {
      // Only add if not already in enhanced notifications
      // For old notifications, we'll use a different ID range or check by content
      if (!enhancedIds.has(oldNotif.id)) {
        allNotifications.push(oldNotif);
      }
    });

    // Sort by created_at descending
    allNotifications.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });

    // Apply limit if specified
    const finalNotifications = options.limit 
      ? allNotifications.slice(0, options.limit)
      : allNotifications;

    res.json({
      success: true,
      notifications: finalNotifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// Mark notification as read (check both tables)
router.put('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Try enhanced table first
    let notification = await notificationService.markAsRead(notificationId, userId);

    // If not found, try old table
    if (!notification) {
      const updateResult = await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [notificationId, userId]);

      if (updateResult.rows.length > 0) {
        notification = {
          ...updateResult.rows[0],
          channel: 'in_app',
          severity: 'medium',
          is_delivered: false,
          delivery_attempts: 0
        };
      }
    }

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or unauthorized'
      });
    }

    res.json({
      success: true,
      notification: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// Mark all notifications as read (both tables)
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update both tables
    await Promise.all([
      pool.query(`
        UPDATE notifications_enhanced 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId]),
      pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId])
    ]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

// Get unread notification count (from both tables)
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Count from both tables
    const [enhancedCount, oldCount] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) as unread_count
        FROM notifications_enhanced
        WHERE user_id = $1 AND is_read = false
      `, [userId]),
      pool.query(`
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE user_id = $1 AND is_read = false
      `, [userId])
    ]);

    const totalUnread = parseInt(enhancedCount.rows[0].unread_count) + 
                        parseInt(oldCount.rows[0].unread_count);

    res.json({
      success: true,
      unreadCount: totalUnread
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

// Delete notification (check both tables)
router.delete('/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Try enhanced table first
    let deleteResult = await pool.query(`
      DELETE FROM notifications_enhanced 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    // If not found, try old table
    if (deleteResult.rows.length === 0) {
      deleteResult = await pool.query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [notificationId, userId]);
    }

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

module.exports = router;

