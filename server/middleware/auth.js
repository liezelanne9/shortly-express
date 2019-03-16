const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) { // user has no cookies at all
    newSession(req, res, next);
  } else { // user has some cookies
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(data => {
        if (!data) {
          newSession(req, res, next);
        } else {
          models.Users.get({ id: data.userId })
            .then(userData => {
              if (userData) {
                req.session = { hash: req.cookies.shortlyid, userId: userData.id, user: { username: userData.username } };
              } else {
                req.session = { hash: req.cookies.shortlyid };
              }
              next();
            });
        }
      }).catch(err => console.log('Session creation error', err));
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

function newSession (req, res, next) {
  models.Sessions.create()
    .then(result => {
      return models.Sessions.get({ id: result.insertId })
        .then(resultsObj => {
          res.cookie('shortlyid', resultsObj.hash);
          req.session = resultsObj;
          next();
        });
    }).catch(err => console.log('Session creation error', err));
}
