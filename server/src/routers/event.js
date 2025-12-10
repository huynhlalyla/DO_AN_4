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
    cancelEvent,
    loginAttendance,
    getAttendanceList,
    markAttendance,
    exportAttendance,
    importAttendance,
    getEventAttendanceInfo,
    restoreEvent
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
router.get('/:id/attendance-info', getEventAttendanceInfo); // New
router.get('/:id/attendance-list', getAttendanceList); // New
router.get('/:id/export-attendance', exportAttendance); // New
router.get('/:id', getEventById);

// POST routes
router.post('/', upload.single('image'), createEvent);
router.post('/attendance-login', loginAttendance); // New
router.post('/:id/register', registerEvent);
router.post('/:id/unregister', unregisterEvent);
router.post('/:id/cancel', cancelEvent);
router.post('/:id/restore', restoreEvent);
router.post('/:id/approve', approveEvent);
router.post('/:id/reject', rejectEvent);
router.post('/:id/mark-attendance', markAttendance); // New
router.post('/:id/import-attendance', upload.single('file'), importAttendance); // New

// PUT routes
router.put('/:id', upload.single('image'), updateEvent);

// DELETE routes
router.delete('/:id', deleteEvent);

export default router;
