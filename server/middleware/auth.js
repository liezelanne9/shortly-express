const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (JSON.stringify(req.cookies) === "{}") {
    return models.Sessions.create()
      .then(result => {
        return models.Sessions.get({ id: result.insertId })
          .then(resultsObj => {
            req.session = resultsObj;
            req.cookies.shortlyid = resultsObj.hash;
            next();
          });
      }).catch(err => console.log('Session creation error', err));
  } else {
    next();
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

