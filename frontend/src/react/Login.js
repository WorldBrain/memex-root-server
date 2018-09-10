import PropTypes from 'prop-types'
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';

class LoginComponent extends Component {
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

export const Login = withRouter(LoginComponent)

function getLoginErrorText(error) {
  const internal = 'Something has gone horribly wrong on our end  :S  Please try again later...'
  return {
    internal,
    'unknown-email': 'Hmm, we do not know anyone with that e-mail address',
  }[error] || internal
}

export class LoginStarted extends Component {
  render() {
    return (
      <div>
        We've sent you a magic login link  :)
      </div>
    )
  }
}

class LoginFinishComponent extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
    services: PropTypes.object.isRequired,
  }

  state = {
    'status': 'pending',
    'error': ''
  }

  async componentDidMount() {
    const search = this.props.location.search
    const email = decodeURIComponent(/email=([^&]+)/.exec(search)[1])
    const code = /code=([^&]+)/.exec(search)[1]

    const result = await this.props.backend.finishLogin(email, code)
    if (!result.success) {
      this.setState({status: 'error', error: result.error})
    } else {
      this.setState({status: 'done'})
      this.props.services.postAuthRedirect(this.props.storage)
    }
  }

  render() {
    return (
      <div>
        {this.state.status === 'pending' && "Logging you in..."}
        {this.state.status === 'error' && "Something has gone wrong logging you in..."}
        {this.state.status === 'done' && "It worked! Now sending you back to wherever you came from  :)"}
      </div>
    )
  }
}

export const LoginFinish = withRouter(LoginFinishComponent)
