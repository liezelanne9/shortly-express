const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    let cookies = {};
    let cookieCrisps = req.headers.cookie.split('; ');
    let coookieCrisps = cookieCrisps.map(cookie => cookie.split('='));
    coookieCrisps.forEach(crisp => cookies[crisp[0]] = crisp[1]);
    req.cookies = cookies;
    next();
  } else {
    req.cookies = {};
    next();
  }
};

module.exports = parseCookies;