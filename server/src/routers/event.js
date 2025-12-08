import express from 'express';
import upload from '../middlewares/upload.js';
import {
    getAllEvents,
    getEventById,
    getEventsBySemester,
    getEventsByApprovalStatus,
    getEventsForStudent,
    getMyEvents,
    getCreatedEvents,
    getEventParticipants,
    createEvent,
    updateEvent,
    approveEvent,
    rejectEvent,
    deleteEvent,
    registerEvent,
    unregisterEvent,
    cancelEvent
} from '../controllers/eventController.js';

const router = express.Router();

// GET routes
router.get('/', getAllEvents);
router.get('/my-events', getMyEvents); // Đặt trước /:id để tránh conflict
router.get('/created-by-me', getCreatedEvents);
router.get('/for-student', getEventsForStudent);
router.get('/semester/:semesterId', getEventsBySemester);
router.get('/status/:status', getEventsByApprovalStatus);
router.get('/:id/participants', getEventParticipants);
router.get('/:id', getEventById);

// POST routes
router.post('/', upload.single('image'), createEvent);
router.post('/:id/register', registerEvent);
router.post('/:id/unregister', unregisterEvent);
router.post('/:id/cancel', cancelEvent);
router.post('/:id/approve', approveEvent);
router.post('/:id/reject', rejectEvent);

// PUT routes
router.put('/:id', upload.single('image'), updateEvent);

// DELETE routes
router.delete('/:id', deleteEvent);

export default router;
