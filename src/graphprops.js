import React from 'react';
import ReactDOM, { render } from 'react-dom';

class PropEditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: '1000', token: '6.28'};
  
      this.handleValue = this.handleValue.bind(this);
      this.handleToken = this.handleToken.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleValue(event) {
      this.setState({value: event.target.value});
    }
    handleToken(event) {
      this.setState({token: event.target.value})
    }
  
    handleSubmit(event) {
      alert('A name was submitted: ' + this.state.value);
      event.preventDefault();
    }
  
    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <label>
            Principal ($):
            <input type="text" value={this.state.value} onChange={this.handleValue} />
          </label>
          <label>
            APY (%):
            <input type="text" token={this.state.token} onChange={this.handleToken} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      );
    }
  }

export default PropEditor