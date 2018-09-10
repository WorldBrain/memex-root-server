import PropTypes from 'prop-types'
import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import * as login from './Login'
import * as registration from './Registration'
// import logo from './logo.svg';
import * as styles from './App.css';

class App extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
    storage: PropTypes.object.isRequired,
    services: PropTypes.object.isRequired,
  }

  render() {
    const {backend, storage, services} = this.props
    const renderRoute = component => () => React.createElement(component, {backend, storage, services})

    return (
      <div className={styles.App}>
        <Route exact path="/auth/login" render={renderRoute(login.Login)} />
        <Route exact path="/auth/login/started" render={renderRoute(login.LoginStarted)} />
        <Route exact path="/auth/login/finish" render={renderRoute(login.LoginFinish)} />
        <Route exact path="/auth/register" render={renderRoute(registration.Register)} />
        <Route exact path="/auth/register/started" render={renderRoute(registration.RegisterStarted)} />
        <Route exact path="/email/verify" render={renderRoute(registration.RegisterFinish)} />
      </div>
    )
  }
}

export default App
