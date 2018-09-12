import AuthBackend, { getRootOrigin } from './backend';
import Storage from './storage';
import setupUi from './react'
// import registerServiceWorker from './registerServiceWorker';

const backend = new AuthBackend(getRootOrigin())
const storage = new Storage()
const services = {
    postAuthRedirect: async () => {
        let url = await storage.getReturnTo()
        if (!url) {
            return
        }
        if (url.indexOf('http') !== 0) {
            url = `${getRootOrigin()}${url}`
        }

        window.location.href = url
    }
}
setupUi({backend, storage, services})

Object.assign(window, {backend, storage, services})

// registerServiceWorker();
