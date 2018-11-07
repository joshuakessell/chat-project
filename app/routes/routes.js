const db = require('../models');

module.exports = function (app) {



    // PUT route for updating the sessionid
    app.put('/db/:sessionID', function (req, res) {
        db.User.update(req.body, {
        where: {email: req.params.email}})
            .then(function (dbUser) {
            res.json(dbUser);
        }).catch(function (error) {
            res.json({
                error: error
            });
        });
    });

}