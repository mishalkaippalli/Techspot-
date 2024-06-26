const passport = require('passport')
const User = require('../models/userSchema')
const GoogleStrategy = require('passport-google-oauth2').Strategy

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:process.env.GOOGLE_CLIENT_callbackURL,
    passReqToCallback:true
}, async function (request ,accesTocken,refreshToken,profile,done){
    console.log('Google authentication callback reached.');
    console.log('Profile:', profile);
    return done(null,profile )
}
))

passport.serializeUser(function(user,done){
    done(null,user)
})

passport.deserializeUser(function(user,done){
    done(null,user)
})