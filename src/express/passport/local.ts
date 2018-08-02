// const crypto = bluebird.promisifyAll(require('crypto'))
import { Strategy as LocalStrategy } from 'passport-local'
import { UserStorage } from '../../components/storage/modules/auth'
import { PasswordHasher } from '../../components/password-hasher'

export function createLocalStrategy({userStorage, passwordHasher} : {userStorage : UserStorage, passwordHasher : PasswordHasher}) {
    return new new LocalStrategy(async (email, password, done) => {
        try {
            const user = await userStorage.findByIdentifier(`email:${email}`)
            const isMatch = await passwordHasher.compare({password, hash: user.passwordHash})
            if (isMatch) {
                done(null, user)
            } else {
                done(null, false, {message: 'Incorrect email or password'})
            }
        } catch (err) {
            done(err)
        }
    })
}
