import React, { Component } from 'react';

class Template extends Component {
  render() {
    return (
      <div className="container w-100 h-100 position-relative d-flex flex-column">
        {this.props.children}
      </div>
    );
  }
}

export default Template;