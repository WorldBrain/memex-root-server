import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { ProviderConfiguration } from './types'

export function createGoogleStrategy(config : ProviderConfiguration) {
    return new GoogleStrategy({
        clientID: config.id,
        clientSecret: config.secret,
        callbackURL: config.callbackUrl,
      }, (accessToken, refreshToken, params, profile, done) => {
        return done(null, {
          identifier: `google:${profile.id}`,
          profile,
          accessToken,
          refreshToken,
          expiresInSeconds: params.expires_in
        })

        //    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        //      return done(err, user);
        //    });
      }
    )
}
