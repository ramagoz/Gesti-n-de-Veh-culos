module.exports = {
    isLoggedIn(req, res, next) {
        if (req.session.auth) {
            return next();
        } else {
            req.session.auth = false;
            res.redirect('/');
        }
    }
};