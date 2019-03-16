const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) { // user has no cookies at all
    newSession(req, res, next);
  } else { // user has some cookies
    models.Sessions.get({ hash: req.cookies.shortlyid }) // grabbing the session data matching the cookie value (hash)
      .then(data => {
        if (!data) {
          newSession(req, res, next); // if not found, give them a new session
        } else {
          models.Users.get({ id: data.userId }) // does this person have an account?
            .then(userData => {
              if (userData) {   // if they have an account, reassign req.session object with their account info
                req.session = { hash: req.cookies.shortlyid, userId: userData.id, user: { username: userData.username } };
              } else {  // if userId was null (no account) assign a new session to their request
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
          res.cookie('shortlyid', resultsObj.hash); // assigns new cookie
          req.session = { hash: resultsObj.hash }; // attaches a session to the request
          next();
        });
    }).catch(err => console.log('Session creation error', err));
}
