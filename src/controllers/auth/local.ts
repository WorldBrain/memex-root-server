import { VerificationEmailGenerator } from './../../components/verification-email-generator';
import { PasswordHasher } from '../../components/password-hasher'
import { UserStorage } from '../../components/storage/modules/auth'
import { Mailer } from '../../components/mailer'

export function register(
    {userStorage, passwordHasher, mailer, verificationEmailGenerator, baseUrl} :
    {userStorage : UserStorage, passwordHasher : PasswordHasher, mailer : Mailer, verificationEmailGenerator : VerificationEmailGenerator, baseUrl : string}
) {
    return async ({email, password} : {email : string, password : string}) => {
        const passwordHash = await passwordHasher.hash(password)
        const { error, emailVerificationCode } = await userStorage.registerUser({email, passwordHash})
        if (error) {
            return error
        }

        await mailer.send({
            from: 'no-reply@memex.cloud',
            to: email,
            subject: 'Activate your Memex Cloud account!',
            ...verificationEmailGenerator.generateVerificationEmail({
                link: `${baseUrl}/email/verify?code=${emailVerificationCode}`
            }),
        })
    }
}
