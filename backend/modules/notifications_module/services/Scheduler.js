/**
 * Scheduler
 * Handles scheduled notifications (reminders, recurring tasks)
 */
const NotificationService = require('./NotificationService');
const pool = require('../../../config/database');

class Scheduler {
  constructor() {
    this.notificationService = new NotificationService();
    this.jobs = new Map();
  }

  /**
   * Schedule a recurring notification
   */
  async scheduleRecurringNotification(userId, notificationData, schedule) {
    // schedule: { frequency: 'daily'|'weekly', time: 'HH:MM', daysOfWeek: [0-6] }
    
    // Store in database first to get the ID
    const result = await pool.query(`
      INSERT INTO scheduled_notifications 
      (user_id, notification_data, schedule_type, schedule_config, is_active, next_run_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      userId,
      JSON.stringify(notificationData),
      schedule.frequency,
      JSON.stringify(schedule),
      true,
      this.calculateNextRun(schedule)
    ]);

    const jobId = result.rows[0].id;

    // Schedule in memory (in production, use node-cron or similar)
    this.scheduleJob(jobId, schedule, async () => {
      await this.notificationService.createNotification({
        ...notificationData,
        user_id: userId
      });
    });

    return jobId.toString();
  }

  /**
   * Schedule a one-time notification
   */
  async scheduleOneTimeNotification(userId, notificationData, scheduledTime) {
    const scheduledDate = new Date(scheduledTime);

    // Store in database first to get the ID
    const result = await pool.query(`
      INSERT INTO scheduled_notifications 
      (user_id, notification_data, schedule_type, schedule_config, is_active, next_run_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      userId,
      JSON.stringify(notificationData),
      'onetime',
      JSON.stringify({ scheduledTime }),
      true,
      scheduledDate
    ]);

    const jobId = result.rows[0].id;

    // Calculate delay
    const delay = scheduledDate.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        await this.notificationService.createNotification({
          ...notificationData,
          user_id: userId
        });
        // Mark as completed
        await pool.query(`
          UPDATE scheduled_notifications 
          SET is_active = false 
          WHERE id = $1
        `, [jobId]);
      }, delay);
    }

    return jobId.toString();
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(jobId) {
    // Convert to integer if it's a string
    const id = typeof jobId === 'string' ? parseInt(jobId) : jobId;
    
    await pool.query(`
      UPDATE scheduled_notifications 
      SET is_active = false 
      WHERE id = $1
    `, [id]);

    // Clear from memory
    if (this.jobs.has(id)) {
      clearInterval(this.jobs.get(id));
      this.jobs.delete(id);
    }
    
    // Also try with string key
    if (this.jobs.has(jobId)) {
      clearInterval(this.jobs.get(jobId));
      this.jobs.delete(jobId);
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  calculateNextRun(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    if (schedule.frequency === 'daily') {
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      return nextRun;
    } else if (schedule.frequency === 'weekly') {
      const nextRun = new Date(now);
      const currentDay = now.getDay();
      const targetDays = schedule.daysOfWeek || [0]; // Default to Sunday
      
      // Find next matching day
      let daysToAdd = 0;
      for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (targetDays.includes(checkDay)) {
          daysToAdd = i;
          break;
        }
      }
      if (daysToAdd === 0 && now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes) {
        daysToAdd = 7; // Next week
      }

      nextRun.setDate(nextRun.getDate() + daysToAdd);
      nextRun.setHours(hours, minutes, 0, 0);
      return nextRun;
    }

    return now;
  }

  /**
   * Schedule a job in memory (simple implementation)
   */
  scheduleJob(jobId, schedule, callback) {
    if (schedule.frequency === 'daily') {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const now = new Date();
      const nextRun = this.calculateNextRun(schedule);
      const delay = nextRun.getTime() - now.getTime();

      setTimeout(() => {
        callback();
        // Schedule next occurrence
        const interval = 24 * 60 * 60 * 1000; // 24 hours
        const intervalId = setInterval(callback, interval);
        this.jobs.set(jobId, intervalId);
      }, delay);
    }
    // Add more schedule types as needed
  }

  /**
   * Process pending scheduled notifications (called by cron)
   */
  async processPendingNotifications() {
    const now = new Date();
    const result = await pool.query(`
      SELECT * FROM scheduled_notifications 
      WHERE is_active = true 
      AND next_run_at <= $1
    `, [now]);

    for (const scheduled of result.rows) {
      try {
        const notificationData = typeof scheduled.notification_data === 'string'
          ? JSON.parse(scheduled.notification_data)
          : scheduled.notification_data;
        
        await this.notificationService.createNotification({
          ...notificationData,
          user_id: scheduled.user_id
        });

        // Update next run time or mark as inactive for one-time notifications
        const scheduleConfig = typeof scheduled.schedule_config === 'string'
          ? JSON.parse(scheduled.schedule_config)
          : scheduled.schedule_config;
        
        if (scheduled.schedule_type === 'onetime') {
          // Mark one-time notifications as inactive after sending
          await pool.query(`
            UPDATE scheduled_notifications 
            SET is_active = false, last_run_at = $1
            WHERE id = $2
          `, [now, scheduled.id]);
        } else {
          // Update next run time for recurring notifications
          const nextRun = this.calculateNextRun(scheduleConfig);
          await pool.query(`
            UPDATE scheduled_notifications 
            SET next_run_at = $1, last_run_at = $2
            WHERE id = $3
          `, [nextRun, now, scheduled.id]);
        }
      } catch (error) {
        console.error(`Error processing scheduled notification ${scheduled.id}:`, error);
      }
    }
  }
}

module.exports = Scheduler;

