// const crypto = bluebird.promisifyAll(require('crypto'))
import { Strategy as LocalStrategy } from 'passport-local'
import { UserStorage } from '../../components/storage/modules/auth'
import { PasswordHasher } from '../../components/password-hasher'

export function createLocalStrategy({userStorage, passwordHasher} : {userStorage : UserStorage, passwordHasher : PasswordHasher}) {
    return new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, async (email, password, done) => {
        try {
            const user = await userStorage.findByIdentifier(`email:${email}`, {withPasswordHash: true})
            if (!user) {
                done(new Error('User not found'))
            }

            const isMatch = await passwordHasher.compare({password, hash: user.passwordHash})
            if (isMatch) {
                delete user['passwordHash']
                done(null, user)
            } else {
                done(new Error('Wrong password'))
            }
        } catch (err) {
            done(err)
        }
    })
}
