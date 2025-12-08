import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import { sendReminderEmail } from '../services/emailService.js';

export const startReminderJob = () => {
    // Check every hour
    setInterval(async () => {
        const now = new Date();
        // Run only at 8 AM (server time)
        if (now.getHours() === 8) {
            console.log('Running reminder job...');
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            try {
                const events = await Event.find({
                    eventDate: {
                        $gte: tomorrow,
                        $lt: dayAfterTomorrow
                    },
                    isActive: true,
                    approvalStatus: 'approved'
                });

                for (const event of events) {
                    const participations = await EventParticipation.find({
                        event: event._id,
                        status: 'registered'
                    }).populate('student');

                    const emails = participations.map(p => p.student.email).filter(e => e);
                    if (emails.length > 0) {
                        await sendReminderEmail(emails, event);
                    }
                }
            } catch (error) {
                console.error('Reminder job error:', error);
            }
        }
    }, 60 * 60 * 1000); // 1 hour
};
