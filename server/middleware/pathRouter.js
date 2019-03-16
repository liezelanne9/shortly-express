const models = require('../models');

function pathRouter(req, res, next) {
  if (req.path !== '/login' && req.path !== '/signup') {
    if (!models.Sessions.isLoggedIn(req.session)) {
      res.redirect('/login');
    } else {
      next();
    }
  } else {
    next();
  }
}

module.exports = pathRouter;
