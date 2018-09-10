import { Strategy as LocalStrategy } from 'passport-local'
import { PasswordlessTokenStorage } from '../../components/storage/modules/passwordless'
import { UserStorage } from '../../components/storage/modules/auth';

export function createPasswordlessStrategy(
    {passwordlessTokenStorage, userStorage} : {passwordlessTokenStorage : PasswordlessTokenStorage, userStorage : UserStorage}
) {
    return new LocalStrategy({
        usernameField: 'email',
        passwordField: 'token',
    }, async (email, token, done) => {
        try {
            const valid = await passwordlessTokenStorage.authenticate({email, token})
            if (!valid) {
                return done(new Error('Invalid token'))
            }

            const user = await userStorage.findByIdentifier(`email:${email}`)
            if (!user) {
                return done(new Error('User not found, should never happen'))
            }

            done(null, user)
        } catch (err) {
            done(err)
        }
    })
}
