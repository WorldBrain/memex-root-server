export interface VerificationEmailGenerator {
    generateVerificationEmail({link} : {link : string}) : Promise<{text, html?}>
}

export class StaticVerificationEmailGenerator implements VerificationEmailGenerator {
    async generateVerificationEmail({link} : {link : string}) {
        return {
            text: `Hey, you're almost done registering your new Memex Cloud account. Exactly one click away to be precise:\n${link}`
        }
    }
}