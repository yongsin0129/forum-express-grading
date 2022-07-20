const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) =>
      err ? next(err) : res.render('restaurants', data)
    )
  },

  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [Category, { model: Comment, include: User }, { model: User, as: 'FavoritedUsers' }], // 拿出關聯的 Category model
      nest: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        // 教案使用使用者去比對: 檢查有收藏此餐廳的使用者列表 有無 與現在的 req.user 相同
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        // 嘗試使用另外一種邏輯，先將使用者 like 的餐廳id列出後，再用 some 去比對現在點選的餐廳有無在 like 列表中
        const likedRestaurantsId = req.user && req.user.LikedRestaurants.map(fr => fr.id)
        const isLiked = likedRestaurantsId.some(id => id === restaurant.id)
        res.render('restaurant', { restaurant: restaurant.toJSON(), isFavorited, isLiked })
      })
      .catch(err => next(err))
  },

  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category, // 拿出關聯的 Category model
      nest: true,
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', { restaurant })
      })
      .catch(err => next(err))
  },

  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', { restaurants, comments })
      })
      .catch(err => next(err))
  },

  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({ include: { model: User, as: 'FavoritedUsers' }, nest: true })
      .then(restaurants => {
        const result = restaurants
          .map(restaurant => {
            return {
              ...restaurant.toJSON(),
              description: restaurant.description.substring(0, 150),
              favoritedCount: restaurant.FavoritedUsers.length,
              // 從 passport deserializeUser 中拿到 FavoritedRestaurants 與 restaurants 比對
              isFavorited:
                req.user && req.user.FavoritedRestaurants.some(f => f.id === restaurant.id)
            }
          })
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
        res.render('top-restaurants', { restaurants: result.slice(0, 10) })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
