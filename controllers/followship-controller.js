const { Followship, User } = require('../models')
const { getUser } = require('../_helpers')
const followshipController = {
  postFollowing: async (req, res, next) => {
    try {
      const followerId = getUser(req).dataValues.id
      const followingId = req.body.id

      if (Number(followingId) === Number(followerId)) {
        const error = new Error('使用者不能追蹤自己！')
        error.status = 400
        throw error
      }

      const user = await User.findByPk(followingId)
      if (!user) {
        const error = new Error('追蹤對象不存在！')
        error.status = 404
        throw error
      }

      const followship = await Followship.findOne({ where: { followerId, followingId } })
      if (followship) {
        const error = new Error('使用者已追蹤此對象！')
        error.status = 400
        throw error
      }

      await Followship.create({ followerId, followingId })
      return res.status(200).json({ id: followingId })
    } catch (err) { next(err) }
  },
  deleteFollowing: async (req, res, next) => {
    try {
      const followerId = getUser(req).dataValues.id
      const { followingId } = req.params

      if (Number(followingId) === Number(followerId)) {
        const error = new Error('使用者不能取消追蹤自己！')
        error.status = 400
        throw error
      }

      const user = await User.findByPk(followingId)
      if (!user) {
        const error = new Error('追蹤對象不存在！')
        error.status = 404
        throw error
      }
      const followship = await Followship.findOne({ where: { followerId, followingId } })
      if (!followship) {
        const error = new Error('使用者未追蹤此對象！')
        error.status = 400
        throw error
      }

      await followship.destroy()
      const data = user.dataValues
      Object.keys(data).forEach(e => {
        if (!['id', 'name', 'avatar', 'introduction'].includes(e)) return delete data[e]
      })
      return res.status(200).json(user)
    } catch (err) { next(err) }
  }
}
module.exports = followshipController
