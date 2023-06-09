const express = require('express')
const router = express.Router()
const admin = require('./modules/admin')
const users = require('./modules/users')
const tweets = require('./modules/tweets')
const followships = require('./modules/followships')
const userController = require('../controllers/user-controller')
const adminController = require('../controllers/admin-controller')
const { errorHandler } = require('../middleware/error-handler')
const { authenticated, authenticatedUser, authenticatedAdmin } = require('../middleware/auth')

// no need to authenticate
router.post('/admin/login', adminController.login)
router.post('/users/login', userController.login)
router.post('/users', userController.signUp)

router.use('/admin', authenticated, authenticatedAdmin, admin)
router.use('/users', authenticated, authenticatedUser, users)
router.use('/tweets', authenticated, authenticatedUser, tweets)
router.use('/followships', authenticated, authenticatedUser, followships)
router.get('/top_followed_users', authenticated, authenticatedUser, userController.getTopUsers)

router.use('/', errorHandler)

module.exports = router
