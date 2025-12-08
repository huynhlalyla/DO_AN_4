import express from 'express';
import facultyController from '../controllers/facultyController.js';

const facultyRouter = express.Router();

// Routes
facultyRouter.get('/', facultyController.getAllFaculties);
facultyRouter.get('/:id', facultyController.getFacultyById);
facultyRouter.post('/', facultyController.createFaculty);
facultyRouter.put('/:id', facultyController.updateFaculty);
facultyRouter.delete('/:id', facultyController.deleteFaculty);

export default facultyRouter;
