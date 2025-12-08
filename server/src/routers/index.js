import accountRouter from './account.js';
import facultyRouter from './faculty.js';
import classRouter from './class.js';
import studentRouter from './student.js';
import categoryRouter from './category.js';
import criteriaRouter from './criteria.js';
import eventRouter from './event.js';
import semesterRouter from './semester.js';
// import userRouter from './user.js'; // DEPRECATED: Không dùng User model nữa
import adminRouter from './admin.js';
import dashboardRouter from './dashboard.js';
import authRouter from './auth.js';
import uploadRouter from './upload.js';
import error from '../routers/error.js';

const Router = (app) => {
    // Account routes (legacy)
    app.use('/account', accountRouter);

    // Authentication routes
    app.use('/api/auth', authRouter);

    // API routes
    // app.use('/api/users', userRouter); // DEPRECATED
    app.use('/api/dashboard', dashboardRouter);
    app.use('/api/upload', uploadRouter);
    app.use('/api/admins', adminRouter);
    app.use('/api/faculties', facultyRouter);
    app.use('/api/classes', classRouter);
    app.use('/api/students', studentRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/criteria', criteriaRouter);
    app.use('/api/events', eventRouter);
    app.use('/api/semesters', semesterRouter);

    // Error handling
    app.use(error.notFound);
};

export default Router;