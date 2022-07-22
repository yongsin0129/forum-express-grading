const passport = require('../config/passport') // 引入 passport

const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: 'error', message: 'unauthorized' })
    // 因為 passport 在設計的時候，如果在 函式內有傳入callback，那就要自行處理驗證成功的地方
    // 所以當我們使用： 這個方式優化驗證失敗的狀況，就已經傳入callback，當然就要自己處理驗證成功的時候要放入 req.user 的狀況囉！否則在後續操作 req.user 都會是 undefined。
    if (user) req.user = user
    next()
  })(req, res, next)
}

const authenticatedAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next()
  return res.status(403).json({ status: 'error', message: 'permission denied' })
}

module.exports = {
  authenticated,
  authenticatedAdmin
}
