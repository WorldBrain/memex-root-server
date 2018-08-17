export interface EmailGenerator {
    generateVerificationEmail({link} : {link : string}) : Promise<{subject, text, html?}>
    generateLoginEmail({link} : {link : string}) : Promise<{subject, text, html?}>
}

export class StaticVerificationEmailGenerator implements EmailGenerator {
    async generateVerificationEmail({link} : {link : string}) {
        return {
            subject: 'Activate your Memex Cloud account!',
            text: `Hey, you're almost done registering your new Memex Cloud account. Exactly one click away to be precise:\n${link}`
        }
    }

    async generateLoginEmail({link} : {link : string}) {
        return {
            subject: 'Your magic login link!',
            text: `Welcome back! Click here to log in:\n${link}`
        }
    }
}