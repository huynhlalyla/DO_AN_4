import ErrorAPI from "../middlewares/error_api.js";


const notFound = (req, res, next) => {
    return next(new ErrorAPI(404, 'Resource not found'));
}



























export default {
    notFound
}