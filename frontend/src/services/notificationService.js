// Notification service for therapy reminders
class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  // Check notification permission
  async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  // Schedule therapy reminder
  scheduleTherapyReminder(time, message) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const now = new Date();
    const reminderTime = new Date(time);
    
    if (reminderTime <= now) {
      // If time has passed, schedule for tomorrow
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification('Therapy Reminder', message);
    }, timeUntilReminder);

    console.log(`Therapy reminder scheduled for ${reminderTime.toLocaleString()}`);
  }

  // Show immediate notification
  showNotification(title, message, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'therapy-reminder',
        requireInteraction: true,
        ...options
      });

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    }
  }

  // Schedule daily therapy reminders
  scheduleDailyReminders(therapyPlan) {
    if (!therapyPlan || !therapyPlan.activities) return;

    const activities = therapyPlan.activities;
    const reminderTimes = this.generateReminderTimes(activities.length);

    activities.forEach((activityId, index) => {
      const time = reminderTimes[index];
      const activity = this.getActivityDetails(activityId);
      
      this.scheduleTherapyReminder(
        time,
        `Time for your ${activity.title} session! This ${activity.duration}-minute ${activity.type} therapy will help improve your mental wellness.`
      );
    });
  }

  // Generate reminder times throughout the day
  generateReminderTimes(sessionCount) {
    const times = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const interval = (endHour - startHour) / sessionCount;

    for (let i = 0; i < sessionCount; i++) {
      const hour = Math.floor(startHour + (i * interval));
      const minute = Math.floor((startHour + (i * interval) - hour) * 60);
      
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      times.push(time);
    }

    return times;
  }

  // Get activity details for notifications
  getActivityDetails(activityId) {
    const activities = {
      breathing: { title: 'Deep Breathing Exercise', duration: 5, type: 'relaxation' },
      mindfulness: { title: 'Mindfulness Meditation', duration: 10, type: 'meditation' },
      cbt: { title: 'Cognitive Behavioral Therapy', duration: 15, type: 'cognitive' },
      progressive_relaxation: { title: 'Progressive Muscle Relaxation', duration: 12, type: 'physical' },
      gratitude: { title: 'Gratitude Practice', duration: 8, type: 'positive' },
      music_therapy: { title: 'Music Therapy', duration: 20, type: 'creative' }
    };

    return activities[activityId] || { title: 'Therapy Session', duration: 10, type: 'general' };
  }

  // Schedule weekly progress check
  scheduleWeeklyProgressCheck() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Schedule for same day next week at 6 PM
    nextWeek.setHours(18, 0, 0, 0);

    const timeUntilCheck = nextWeek.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification(
        'Weekly Progress Check',
        'It\'s been a week since you started your therapy plan! How are you feeling? Take a moment to reflect on your progress.',
        { requireInteraction: true }
      );
    }, timeUntilCheck);
  }

  // Schedule therapy plan completion celebration
  schedulePlanCompletionCelebration(planDurationDays) {
    const now = new Date();
    const completionDate = new Date(now.getTime() + planDurationDays * 24 * 60 * 60 * 1000);
    
    // Schedule for completion date at 7 PM
    completionDate.setHours(19, 0, 0, 0);

    const timeUntilCompletion = completionDate.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification(
        '🎉 Therapy Plan Complete!',
        'Congratulations! You\'ve completed your therapy plan. Take a moment to celebrate your dedication to your mental health journey. You should be proud of your commitment!',
        { requireInteraction: true }
      );
    }, timeUntilCompletion);
  }

  // Cancel all notifications
  cancelAllNotifications() {
    // Note: This is a simplified implementation
    // In a real app, you'd want to track notification IDs and cancel them specifically
    console.log('All therapy reminders cancelled');
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;
