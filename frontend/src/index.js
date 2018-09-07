import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import AuthBackend, { getRootOrigin } from './backend';
import Storage from './storage';
// import registerServiceWorker from './registerServiceWorker';

const backend = new AuthBackend(getRootOrigin())
const storage = new Storage()

ReactDOM.render((
    <BrowserRouter>
        <App backend={backend} storage={storage} />
    </BrowserRouter>
), document.getElementById('root'))
// registerServiceWorker();
