export default class Storage {
    async storeReturnTo(returnTo) {
        localStorage.setItem('return-to', returnTo)
    }

    async getReturnTo() {
        return localStorage.getItem('return-to')
    }
}