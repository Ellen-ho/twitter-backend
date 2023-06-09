const jwt = require('jsonwebtoken')
const { User, Tweet, Like, Reply, sequelize } = require('../models')
const passport = require('../config/passport')

const adminController = {
  login: (req, res, next) => {
    passport.authenticate('local', { session: false, failWithError: true }, (err, user, info) => {
      // err: null & user: false => 400
      if (!err && !user) {
        const error = new Error('輸入資料不可為空值!')
        error.status = 400
        return next(error)
      }

      if (err || !user) {
        if (err.status === 401) {
          return next(err)
        }
      }
      if (user.role !== 'admin') {
        const error = new Error('驗證失敗!')
        error.status = 401
        return next(error)
      }
      try {
        const userData = user.toJSON()
        delete userData.password
        const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
        res.json({
          token,
          user: { id: userData.id }
        })
      } catch (err) {
        return next(err)
      }
    })(req, res, next)
  },
  getUsers: (req, res, next) => {
    User.findAll({
      include: [
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
        { model: Tweet },
        { model: Like }
      ]
    })
      .then(users => {
        const usersData = users.map(user => {
          const transformedData = {
            ...user.toJSON(),
            followerCounts: user.Followers.length,
            followingCounts: user.Followings.length,
            tweetCounts: user.Tweets.length,
            likeCounts: user.Likes.length
          }
          delete transformedData.password
          delete transformedData.role
          delete transformedData.Followers
          delete transformedData.Followings
          delete transformedData.Tweets
          delete transformedData.Likes
          return transformedData
        })
          .sort((a, b) => b.tweetCounts - a.tweetCounts)

        res.json(usersData)
      })
      .catch(err => next(err))
  },
  getTweets: (req, res, next) => {
    Tweet.findAll({
      attributes: {
        exclude: ['UserId']
      },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      raw: true,
      nest: true
    })
      .then(tweets => {
        const tweetData = tweets.map(tweet =>
          ({
            ...tweet,
            description: tweet.description.substring(0, 50)
          }))
        res.json(tweetData)
      })
      .catch(err => next(err))
  },
  deleteTweet: async (req, res, next) => {
    const t = await sequelize.transaction()

    try {
      const tweetId = req.params.id
      const tweet = await Tweet.findByPk(tweetId)
      if (!tweet) {
        const err = new Error('此推文不存在！')
        err.status = 404
        throw err
      }
      tweet.destroy({ transaction: t })

      await Like.destroy({ where: { Tweet_id: tweetId }, transaction: t })
      await Reply.destroy({ where: { Tweet_id: tweetId }, transaction: t })

      await t.commit()

      return res.status(200).send()
    } catch (error) {
      await t.rollback()
      return next(error)
    }
  }
}

module.exports = adminController
