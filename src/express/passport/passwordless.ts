import { Strategy as LocalStrategy } from 'passport-local'
import { Mailer } from '../../components/mailer'
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
                done(new Error('Invalid token'))
            }

            const user = await userStorage.findByIdentifier(`email:${email}`)
            if (!user) {
                done(new Error('User not found, should never happen'))
            }

            done(null, user)
        } catch (err) {
            done(err)
        }
    })
}
