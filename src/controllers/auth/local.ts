import { EmailGenerator } from '../../components/email-generator';
import { PasswordHasher } from '../../components/password-hasher'
import { UserStorage } from '../../components/storage/modules/auth'
import { Mailer } from '../../components/mailer'

export function register(
    {userStorage, passwordHasher, mailer, emailGenerator, baseUrl} :
    {userStorage : UserStorage, passwordHasher : PasswordHasher, mailer : Mailer, emailGenerator : EmailGenerator, baseUrl : string}
) {
    return async ({email, password} : {email : string, password : string}) => {
        const passwordHash = await passwordHasher.hash(password)
        const { error, emailVerificationCode } = await userStorage.registerUser({email, passwordHash})
        if (error) {
            return { error }
        }
        
        try {
            await mailer.send({
                to: email,
                ...await emailGenerator.generateVerificationEmail({
                    link: `https://static.memex.cloud/email/verify?code=${emailVerificationCode}`
                }),
            })
        } catch (err) {
            console.error(err)
            return { error: 'verification-mail-failed' }
        }

        return { success: true }
    }
}
