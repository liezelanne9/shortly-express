const models = require('../models');

function pathRouter(req, res, next) {
  if (req.path === '/') {
    if (models.Sessions.isLoggedIn(req.session)) {
      next();
    }
    res.redirect('/login');
  }
}

module.exports = pathRouter;