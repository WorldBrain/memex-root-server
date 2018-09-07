import PropTypes from 'prop-types'
import React, { Component } from 'react';
import { Link, Route, withRouter } from 'react-router-dom';
// import logo from './logo.svg';
// import './App.css';

class App extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
    storage: PropTypes.object.isRequired,
  }

  render() {
    return (
      <div className="App">
        <Route exact path="/auth/login/started" render={props => <LoginStarted {...props} backend={this.props.backend} />} />
        <Route exact path="/auth/login" render={
          props => <Login {...props} backend={this.props.backend} storage={this.props.storage} />
        } />
        <Route exact path="/auth/register" render={props => <Register {...props} backend={this.props.backend} />} />
        <Route exact path="/auth/register/started" render={props => <RegisterStarted {...props} backend={this.props.backend} />} />
        <Route exact path="/email/verify" render={
          props => <RegisterFinish {...props} backend={this.props.backend} storage={this.props.storage} />
        } />
      </div>
    )
  }
}

class Login extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
    storage: PropTypes.object.isRequired,
  }

  state = {
    status: 'pristine',
    email: '',
    error: ''
  }

  componentDidMount() {
    this.storeReturnTo(this.props.location.search)
  }

  storeReturnTo(searchString) {
    const returnToEncodeded = searchString.split('returnTo=')[1]
    if (!returnToEncodeded) {
      return
    }

    const returnTo = decodeURIComponent(returnToEncodeded)
    this.props.storage.storeReturnTo(returnTo)
  }

  async login() {
    this.setState({status: 'pending'})
    const result = await this.props.backend.startLogin(this.state.email)
    if (result.error) {
      this.setState({status: 'error', error: result.error})
    } else {
      this.props.history.push(`/auth/login/started?email=${this.state.email}`)
    }
  }

  render() {
    return (
      <div>
        <p>Sign in with your e-mail address</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={this.state.email}
          onChange={event => this.setState({email: event.target.value})} />
        <button onClick={() => this.login()}>Sign in</button>
        {this.state.error && <p>{getLoginErrorText(this.state.error)}</p>}
        <p>
          Don't have an account yet?&nbsp;
          <Link to="/auth/register">Register</Link>
        </p>
      </div>
    )
  }
}

Login = withRouter(Login)

function getLoginErrorText(error) {
  const internal = 'Something has gone horribly wrong on our end  :S  Please try again later...'
  return {
    internal,
    'unknown-email': 'Hmm, we do not know anyone with that e-mail address',
  }[error] || internal
}

class LoginStarted extends Component {
  render() {
    return (
      <div>
        We've sent you a magic login link  :)
      </div>
    )
  }
}

class Register extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
  }

  state = {
    status: 'pristine',
    email: '',
    error: ''
  }

  async register() {
    this.setState({status: 'pending'})
    const result = await this.props.backend.startRegistration(this.state.email)
    if (result.error) {
      this.setState({status: 'error', error: result.error})
    } else {
      this.props.history.push(`/auth/register/started`)
    }
  }

  render() {
    return (
      <div>
        <p>Register a new Memex.Cloud account</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={this.state.email}
          onChange={event => this.setState({email: event.target.value})} />
        <button onClick={() => this.register()}>Register</button>
        {this.state.error && <p>{getRegisterErrorText(this.state.error)}</p>}
        <p>
          Already have an account?&nbsp;
          <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    )
  }
}

Register = withRouter(Register)

function getRegisterErrorText(error) {
  const internal = 'Something has gone horribly wrong on our end  :S  Please try again later...'
  return {
    internal,
    'exists': "Someone already registered with that e-mail address",
  }[error] || internal
}

class RegisterStarted extends Component {
  render() {
    return (
      <div>
        Almost there! Please check your e-mail to confirm your account.
      </div>
    )
  }
}

class RegisterFinish extends Component {
  static propTypes = {
    storage: PropTypes.object.isRequired,
  }

  state = {
    'status': 'pending',
    'error': ''
  }

  async componentDidMount() {
    const result = await this.props.backend.finishRegistration(this.props.location.search.substr('?code='.length))
    if (!result.success) {
      this.setState({status: 'error', error: result.error})
    } else {
      this.setState({status: 'done'})
      postAuthRedirect(this.props.storage)
    }
  }

  render() {
    return (
      <div>
        {this.state.status === 'pending' && "Verifying your e-mail..."}
        {this.state.status === 'error' && "Something has gone wrong verifying your e-mail address..."}
        {this.state.status === 'done' && "It worked! Now sending you back to wherever you came from  :)"}
      </div>
    )
  }
}

RegisterFinish = withRouter(RegisterFinish)

export async function postAuthRedirect(storage) {
  const url = await storage.getReturnTo()
  if (url) {
    window.location.href = url
  }
}

export default App
