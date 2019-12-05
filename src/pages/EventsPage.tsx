import React, { Component } from 'react';
import Scrollbars from 'react-custom-scrollbars';
import GoogleMap from '../components/GoogleMap';
import { DictInt } from '../utils/Dictionary';
import { Coords } from '../resources/types';
import { PoiType, EventType } from '../types';

interface States {
  events: EventType[];
  pois: PoiType[];
  intensityTable: DictInt<number>;
  markerCoords: Coords[];
  isLoaded: boolean;
}

class EventsPage extends Component<any, States> {
  constructor(props: any) {
    super(props);
    this.state = {
      events: [],
      pois: [],
      intensityTable: {},
      markerCoords: [],
      isLoaded: false
    };
  }

  async componentDidMount() {
    await this.fetch_n_process();
  }

  fetch_n_process = async () => {
    // two api calls started to save time
    let event_promise = fetch('http://localhost:5555/events/daily');
    let poi_promise = fetch('http://localhost:5555/poi');

    // wait on both calls to finish and get their responses
    let [event_response, poi_response] = await Promise.all([event_promise, poi_promise]);

    // if any of the api calls failed, show error on log and exit out of function
    if (event_response.status !== 200 || poi_response.status !== 200) {
      console.error("Failed to fetch data");
      return;
    }

    // wait for events and pois to be received from http call
    let [_eventList, _poiList] = await Promise.all<EventType[], PoiType[]>(
      [event_response.json(), poi_response.json()]
    );

    // map location vs events
    let _table: DictInt<number> = {};
    _eventList.forEach((x, i) => {
      if (_table.hasOwnProperty(x.poi_id))
        _table[x.poi_id]++;
      else
        _table[x.poi_id] = 1;
    });

    // transform coords to Google Map format for markers
    let _markerCoords = _poiList.map(({ lat, lon }): Coords => ({ lat: lat, lng: lon }))

    this.setState({
      events: _eventList,
      pois: _poiList,
      intensityTable: _table,
      markerCoords: _markerCoords,
      isLoaded: true
    });
  }

  render() {
    const { isLoaded } = this.state;
    if (!isLoaded) {
      console.warn('No data found yet');
      return null;
    }

    const { markerCoords, events } = this.state;

    return (
      <div className="w-100 h-100 position-relative container mt-4">
        <div className="position-relative h-auto">
          <Scrollbars className="w-100 h-100" style={{ minHeight: '410px' }}>
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i}>
                    <td>{new Date(e.date).toString("ddd, dd MMMM, yyyy")}</td>
                    <td>{e.hour > 12 ? `${e.hour - 12} pm` : `${e.hour} am`}</td>
                    <td>{e.events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scrollbars>
        </div>
        <div className="position-relative h-100" style={{ minHeight: '200px' }}>
          <GoogleMap markers={markerCoords} />
        </div>
      </div>
    );
  }
}

export default EventsPage;