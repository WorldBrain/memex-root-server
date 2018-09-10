import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './App'


export default function setupUi({backend, storage, services}) {
    ReactDOM.render((
        <BrowserRouter>
            <App backend={backend} storage={storage} services={services} />
        </BrowserRouter>
    ), document.getElementById('root'))    
}