import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="w-100 h-100 bg-dark d-flex justify-content-center align-items-center">
      <div className="card font-noto text-center" style={{ userSelect: "none" }}>
        <h4 className="card-header">Presentation</h4>
        <div className="card-body">
          This is a presentation by Simanto Rahman
        </div>
        <div className="card-footer d-flex justify-content-around text-primary">
          <a href="https://www.linkedin.com" target="_blank" className="scale-hover">
            <h1 className="fab fa-linkedin my-0" />
          </a>
          <a href="https://twitter.com" target="_blank" className="scale-hover">
            <h1 className="fab fa-twitter-square my-0" />
          </a>
          <a href="https://github.com/SimantoR" target="_blank" className="scale-hover">
            <h1 className="fab fa-github-square my-0" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default HomePage;