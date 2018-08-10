import * as fs from 'fs'
import * as path from 'path'
import * as nodemailer from 'nodemailer'
import * as ses from 'node-ses'

export interface Mail {
    from: string,
    to: string,
    subject: string,
    text: string,
    html?: string
}

export interface Mailer {
    send(mail: Mail): Promise<any>
}

export class NodeMailer implements Mailer {
    private transport: nodemailer.Transporter

    constructor(transportConfig) {
        this.transport = nodemailer.createTransport(transportConfig)
    }

    async send(message: Mail) {
        return new Promise((resolve, reject) => {
            this.transport.sendMail(message, (err) => err ? reject(err) : resolve())
        })
    }
}

export class AwsSesMailer implements Mailer {
    private sesClient

    constructor() {
        this.sesClient = ses.createClient()
    }

    async send(mail: Mail) {
        await new Promise((resolve, reject) => {
            const message = mail.html ? mail.html : mail.text
            const altText = mail.html ? {altText: mail.text} : {}
            try {
                this.sesClient.sendEmail({
                    to: mail.to,
                    from: mail.from,
                    subject: mail.subject,
                    message,
                    ...altText
                }, function (err, data, res) {
                    err ? reject(err) : resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    }
}

export class FilesystemMailer implements Mailer {
    constructor(public basePath) {
    }

    async send(message: Mail) {
        const filePath = path.join(this.basePath, `mail_${Date.now()}.json`)
        fs.writeFileSync(filePath, JSON.stringify(message, null, 4))
    }
}

export class MemoryMailer implements Mailer {
    public messages = []

    async send(message: Mail) {
        this.messages.push(message)
    }
}
