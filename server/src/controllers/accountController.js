const createUser = (req, res) => {
    res.json({
        status: 'success',
        message: 'User created',
        method: req.method
    })
}
const getAll = (req, res) => {
    res.json({
        status: 'success',
        message: 'Account route works',
        method: req.method
    })
}
const deleteUser = (req, res) => {
    res.json({
        status: 'success',
        message: 'Account route works',
        method: req.method
    })
}
























export default {
    createUser,
    getAll,
    deleteUser

}