import express from 'express';
import studentController from '../controllers/studentController.js';
import { 
    getStudentScoreSheet, 
    submitSelfScore,
    getClassAssessmentStatus,
    getStudentScoreSheetForSecretary,
    updateStudentScore,
    finalizeStudentAssessment,
    getFacultyClassesStatus,
    approveClassAssessment,
    remindClassSecretary,
    getSchoolAssessmentStatus,
    finalizeFacultyAssessment,
    remindFacultySecretary
} from '../controllers/assessmentController.js';
import { verifyToken } from '../middlewares/auth.js'; // Assuming auth middleware

const studentRouter = express.Router();

// Assessment Routes
studentRouter.get('/assessment/score-sheet', verifyToken, getStudentScoreSheet);
studentRouter.post('/assessment/submit', verifyToken, submitSelfScore);

// Class Secretary Routes
studentRouter.get('/assessment/class/:classId', verifyToken, getClassAssessmentStatus);
studentRouter.get('/assessment/secretary/student/:studentId', verifyToken, getStudentScoreSheetForSecretary);
studentRouter.post('/assessment/secretary/update-score', verifyToken, updateStudentScore);
studentRouter.post('/assessment/secretary/finalize', verifyToken, finalizeStudentAssessment);

// Faculty Secretary Routes
studentRouter.get('/assessment/faculty/:facultyId/classes', verifyToken, getFacultyClassesStatus);
studentRouter.post('/assessment/faculty/approve-class', verifyToken, approveClassAssessment);
studentRouter.post('/assessment/faculty/remind', verifyToken, remindClassSecretary);

// School Secretary Routes
studentRouter.get('/assessment/school/faculties', verifyToken, getSchoolAssessmentStatus);
studentRouter.post('/assessment/school/finalize-faculty', verifyToken, finalizeFacultyAssessment);
studentRouter.post('/assessment/school/remind-faculty', verifyToken, remindFacultySecretary);

// Routes
studentRouter.get('/', studentController.getAllStudents);
studentRouter.get('/class/:classId', studentController.getStudentsByClass);
studentRouter.get('/faculty/:facultyId', studentController.getStudentsByFaculty);
studentRouter.get('/:id', studentController.getStudentById);
studentRouter.post('/', studentController.createStudent);
studentRouter.post('/bulk', studentController.createBulkStudents);
studentRouter.put('/:id', studentController.updateStudent);
studentRouter.put('/:id/secretary', studentController.updateSecretary);
studentRouter.delete('/:id', studentController.deleteStudent);
studentRouter.delete('/class/:classId', studentController.deleteStudentsByClass);

export default studentRouter;
