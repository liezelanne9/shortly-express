const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (JSON.stringify(req.cookies) === "{}") {
    return models.Sessions.create()
      .then(result => {
        return models.Sessions.get({ id: result.insertId })
          .then(resultsObj => {
            res.cookie('shortlyid', resultsObj.hash);
            req.session = resultsObj;
            console.log(resultsObj);
            models.Sessions.get({hash: req.session.hash})
            .then(userId => {
              req.session.userId = userId;
              models.Users.get({id: userId})
                .then(username => {
                  req.session.user.username = username;
                  next();
                }).catch(err => console.log('username not found'));
            }).catch(err => console.log('No user ID found'));
        });
        next();
      }).catch(err => console.log('Session creation error', err));
  } else if (!req.session) {
    return models.Sessions.create()
      .then(result => {
        return models.Sessions.get({ id: result.insertId })
          .then(resultsObj => {
            req.session = resultsObj;
              models.Sessions.get({hash: req.session.hash})
                .then(userId => {
                  req.session.userId = userId;
                  models.Users.get({id: userId})
                    .then(username => {
                      req.session.user.username = username;
                      next();
                    }).catch(err => console.log('username not found'));
                }).catch(err => console.log('No user ID found'));
            });
            next();
        }).catch(err => console.log('Session creation error', err));
  } else {
    next();
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
