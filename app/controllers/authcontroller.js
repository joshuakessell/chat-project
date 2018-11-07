var exports = module.exports = {}

exports.signup = function (req, res) {
    res.render('signup');
}

exports.signin = function (req, res) {
    return res.render('signin') + req.user.username;
}

exports.dashboard = function (req, res) {
    res.render('dashboard');
}

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
    
}