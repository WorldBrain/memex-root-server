import PropTypes from 'prop-types'
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';

class RegisterComponent extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
  }

  state = {
    status: 'pristine',
    email: '',
    error: ''
  }

  async register() {
    this.setState({ status: 'pending' })
    const result = await this.props.backend.startRegistration(this.state.email)
    if (result.error) {
      this.setState({ status: 'error', error: result.error })
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
          onChange={event => this.setState({ email: event.target.value })} />
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

export const Register = withRouter(RegisterComponent)

function getRegisterErrorText(error) {
  const internal = 'Something has gone horribly wrong on our end  :S  Please try again later...'
  return {
    internal,
    'exists': "Someone already registered with that e-mail address",
  }[error] || internal
}

export class RegisterStarted extends Component {
  render() {
    return (
      <div>
        Almost there! Please check your e-mail to confirm your account.
        </div>
    )
  }
}

class RegisterFinishComponent extends Component {
  static propTypes = {
    backend: PropTypes.object.isRequired,
    storage: PropTypes.object.isRequired,
  }

  state = {
    'status': 'pending',
    'error': ''
  }

  async componentDidMount() {
    const result = await this.props.backend.finishRegistration(this.props.location.search.substr('?code='.length))
    if (!result.success) {
      this.setState({ status: 'error', error: result.error })
    } else {
      this.setState({ status: 'done' })
      this.props.services.postAuthRedirect(this.props.storage)
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

export const RegisterFinish = withRouter(RegisterFinishComponent)
