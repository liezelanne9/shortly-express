const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const pathRouter = require('./middleware/pathRouter');
const parseCookies = require('./middleware/cookieParser');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);
app.use(Auth.createSession);
// app.use(pathRouter);

app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup',
  (req, res, next) => {
    let { username, password } = req.body;
    return models.Users.create({ username, password })
      .then((successMsg) => {
        req.session.userId = successMsg.insertId;
        req.session.user = { username };
        return models.Sessions.update({ hash: req.session.hash }, { userId: successMsg.insertId })
          .then(() => {
            res.render('/', (err) => {
              res.status(201).location('/').send(successMsg);
            });
          });
      })
      .catch(err => {
        res.render('/signup', (err) => {
          res.status(404).location('/signup').send(err);
        });
      });
  });

app.post('/login',
  (req, res, next) => {
    let { username = null, password: attempted } = req.body;
    return models.Users.get({ username })
      .then(user => {
        if (models.Users.compare(attempted, user.password, user.salt)) {
          req.session.userId = user.id;
          req.session.user = { username };
          return models.Sessions.update({ hash: req.session.hash }, { userId: user.id })
            .then(() => res.status(201).location('/').send('Login Successful!'));
        } else {
          res.status(404).location('/login').send('Lol try again');
        }
      }).catch(err => res.status(404).location('/login').send(err));
  });

app.get('/logout',
  (req, res, next) => {
    // remove req.session and cookie 
    models.Sessions.delete({ hash: req.session.hash })
      .then(() => {
        delete req.session;
        res.cookie('shortlyid', '').status(200).location('/').send('Bye!');
      }).catch(err => res.status(404).send(err));
  });

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
