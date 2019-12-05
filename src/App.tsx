import React, { CSSProperties } from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import DataMap from './components/DataMap';
import StatsPage from './pages/StatsPage';
import EventsPage from './pages/EventsPage';
import { PoiProps, EventProp, Coords } from './resources/types';
import 'datejs';

interface States {
  poi?: PoiProps[];
  events?: EventProp[];
}

export class App extends React.Component<any, States> {
  private options = {
    date: { keys: ['title', 'author'], id: 'date' }
  }

  constructor(props: any) {
    super(props);
    this.state = {}
  }

  async componentDidMount() {
    let events = await this.fetchEvents();
    let pois = await this.fetchPOI();
    this.setState({
      events: events,
      poi: pois
    });
    window.addEventListener('offline', () => {
      console.log('You went offline');
    });
  }

  navbar = () => {
    let navStyle: CSSProperties = {
      top: 0,
      // position: 'absolute',
      zIndex: 2
    }
    return (
      <div className="w-100 shadow">
        <nav className="navbar navbar-expand-lg navbar-light container w-100" style={navStyle}>
          <span className="navbar-brand">Data Visualizer</span>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
  
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <NavLink exact to="/" className="nav-link">Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/map" className="nav-link">Map</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/events" className="nav-link">Events</NavLink>
              </li>
              {/* <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Dropdown
                </a>
                <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <a className="dropdown-item" href="#">Action</a>
                  <a className="dropdown-item" href="#">Another action</a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#">Something else here</a>
                </div>
              </li> */}
            </ul>
            <form className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2 rounded-pill" type="search" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-info rounded-pill my-2 my-sm-0" type="submit">Search</button>
            </form>
          </div>
        </nav>
      </div>
    )
  }

  fetchPOI = async () => {
    let response = await fetch('http://localhost:5555/poi')
    if (response.status !== 200) {
      console.error('No POI retrieved');
      return;
    }
    let poi_list: PoiProps[] = await response.json();
    return poi_list;
  }

  fetchEvents = async () => {
    let response = await fetch('http://localhost:5555/events/hourly')
    if (response.status !== 200) {
      console.error('No Events retrieved');
      return;
    }
    let event_list: EventProp[] = await response.json();
    return event_list;
  }

  dataTable = () => {
    const { events } = this.state;
    if (!events)
      return null
    return (
      <table className="table table-bordered table-striped container">
        <thead>
          <tr>
            <th>Date</th>
            <th className="text-center">Hour</th>
            <th className="text-center">Events</th>
          </tr>
        </thead>
        <tbody>
          {events.map((x, i) => (
            <tr key={i}>
              {console.log(typeof (x.date))}
              <td>{new Date(x.date).toString('ddd, MMM d, yyyy hh:mm tt')}</td>
              <td className="text-center">{x.hour}</td>
              <td className="text-center">{x.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    const { poi } = this.state;
    let map: JSX.Element | null = null;
    if (poi) {
      let points = poi.map((x, i) => {
        return {
          lat: x.lat,
          lng: x.lon
        } as Coords
      });
      map = <DataMap points={points} />;
    }

    return (
      <div className="w-100 vh-100 d-flex flex-column position-relative">
        <div className="w-100 h-auto">
          <this.navbar />
        </div>
        <Switch>
          <Route path="/map">
            <div className="w-100 h-100 position-relative">
              {map}
            </div>
          </Route>
          <Route path="/stats">
            <StatsPage />
          </Route>
          <Route path="/events">
            <EventsPage />
          </Route>
          <Route>
            <this.dataTable />
          </Route>
        </Switch>
      </div>
    );
  }
}

export default App;