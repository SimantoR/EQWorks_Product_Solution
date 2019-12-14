import React, { CSSProperties } from 'react';

const HomePage = () => {
  const iconStyle: CSSProperties = {
    fontSize: '32px'
  }

  return (
    <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{
      backgroundImage: "url(https://cdn.hipwallpaper.com/i/4/64/yJ9BXi.png)",
      backgroundSize: "cover"
    }}>
      <div className="card font-noto text-center" style={{ userSelect: "none", boxShadow: "0 0 40px black", zIndex: 2}}>
        {/* <h4 className="card-header">Presentation</h4> */}
        <img
          className="card-img-top"
          src={require("../resources/profile.jpg")}
          style={{maxWidth: "600px", width: "100%" }}
          alt="profile"
        />
        {/* <h5 className="card-img-overlay bg-light h-auto w-100 text-right text-white font-noto" style={{textShadow: "2px 2px 5px black"}}>
          Simanto Rahman
        </h5> */}
        {/* <div className="card-body card-text">
          This is a presentation by Simanto Rahman
        </div> */}
        <div className="card-footer d-flex justify-content-around text-primary bg-primary">
          <a href="https://www.linkedin.com/in/simanto-rahman-5aa78211b" rel="noopener noreferrer" target="_blank" className="scale-hover text-white-50">
            <big className="fab fa-linkedin my-0" style={iconStyle} />
          </a>
          <a href="https://twitter.com/simanto_rahman" rel="noopener noreferrer" target="_blank" className="scale-hover text-white-50">
            <big className="fab fa-twitter-square my-0" style={iconStyle} />
          </a>
          <a href="https://github.com/SimantoR" rel="noopener noreferrer" target="_blank" className="scale-hover text-white-50">
            <big className="fab fa-github-square my-0" style={iconStyle} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default HomePage;