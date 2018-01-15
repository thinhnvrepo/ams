const jwt = require('jsonwebtoken');
const User = require('./../models/User');

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        res.locals.user = user;
        next();
    } else {
        // check header or url parameters or post parameters for token
        var token = req.query.token || req.headers['x-access-token'] || req.headers['Authorization'] || req.headers['authorization'] || req.cookies[process.env.TOKEN_KEY];
    
        /**
         * Remove bearer or basic
         */
        if (token){
            token = token.split(' ');
            token = token[token.length - 1];
        }

        /** Verify token => userId */
        this.jwtVerifyToken(token, user => {
            if (user) {
                req.session.user = user;
                res.locals.user = user;
                next();
            } else {
                return res.json({
                    success: false,
                    errorCode: 401,
                    message: 'Authenticate failed'
                });
            }
        });
    }
};

exports.jwtCreateToken = (data) => {
    let token = jwt.sign(data, process.env.JWT_SECRET);

    return token;
}

exports.jwtVerifyToken = (token, cb) => {
    // verifies secret and checks exp
    console.log('token', token);
    jwt.verify(token, process.env.JWT_SECRET, function(err, userId) {  
        console.log('user_id', userId);
        if (err) {
          return cb(null);   
        } else {
          // if everything is good, save to request for use in other routes
            User.findOne({
                _id: userId
            }, (err, user) => {
                if (err) {
                    return cb(null);   
                } else {
                    return cb(user); 
                }
            })
        }
    });
}