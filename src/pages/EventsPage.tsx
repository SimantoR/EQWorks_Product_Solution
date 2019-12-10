import React, { Component } from 'react';
import Scrollbars from 'react-custom-scrollbars';
import GoogleMap from '../components/GoogleMap';
import { Coords } from '../utils/types';
import { PoiType, EventType } from '../utils/types';
import { LineChart } from '../components/chart-js';
import BarLoader from 'react-spinners/BarLoader';
import {
  List, Dictionary
} from 'linqify';

interface States {
  events?: List<EventType>;
  pois: PoiType[];
  intensityMap: _MarkerProps[];
  dateVsEvents?: Dictionary<Date, number>;
  selectedRows: boolean[];
  isLoaded: boolean;
}

type _MarkerProps = { coords: Coords, opacity: number };

class EventsPage extends Component<any, States> {
  constructor(props: any) {
    super(props);
    this.state = {
      pois: [],
      intensityMap: [],
      isLoaded: false,
      selectedRows: []
    };
  }

  componentDidMount() {
    setTimeout(async () => {
      await this.processData();
    }, 1000);
  }

  //#region Helpers
  // Get mapped date-to-event array
  toDateVsEvents = (events: EventType[]) => {
    let eventList = new List(events);

    return eventList.GroupBy(x => x.date).Select(x => ({
      date: new Date(x.Key), events: x.Sum(x => parseInt(x.events.toString()))
    })).ToArray();
  }

  // Get dates from Event dataset
  getDates = (events: EventType[]) => {
    let eventList = new List(events);
    return eventList.Select(x => x.date).Distinct().ToArray();
  }
  //#endregion

  processData = async () => {
    // two api calls started to save time
    const event_promise = fetch('http://localhost:5555/events/daily/100');
    const poi_promise = fetch('http://localhost:5555/poi');

    // wait on both calls to finish and get their responses
    const [event_response, poi_response] = await Promise.all([event_promise, poi_promise]);

    // if any of the api calls failed, show error on log and exit out of function
    if (event_response.status !== 200 || poi_response.status !== 200) {
      console.error("Failed to fetch data");
      return;
    }

    // wait for events and pois to be received from http call
    const [eventList, poiArray] = await Promise.all<List<EventType>, PoiType[]>(
      [event_response.json(), poi_response.json()]
    );

    // let eventList = new List<EventType>(eventArray);
    let eventCountMap: number[] = new Array<number>(poiArray.length);

    // get total events by locaiton
    for (let i = 0; i < poiArray.length; i++) {
      // get total events at give poi location
      let poi_id = poiArray[i].poi_id;
      eventCountMap[i] = eventList.Where((x) => x.poi_id === poi_id).Select(x => x.events).Sum();
    }
    // get highest events in any location
    let maxEventCount = eventCountMap.Max();
    let intensityMap = new Array<_MarkerProps>(poiArray.length);

    for (let i = 0; i < poiArray.length; i++) {
      let opacity = eventCountMap[i] / maxEventCount;
      intensityMap[i] = {
        coords: { lat: poiArray[i].lat, lng: poiArray[i].lon },
        opacity: opacity < 0.4 ? 0.4 : opacity
      };
    }

    this.setState({
      events: eventList,
      pois: poiArray,
      intensityMap: intensityMap,
      isLoaded: true,
      selectedRows: new Array<boolean>(eventList.Count()).fill(false)
    });
  }

  render() {
    const { isLoaded } = this.state;
    if (!isLoaded) {
      console.warn('No data found yet');
      return (
        <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
          <big>Loading dataset...</big>
          <BarLoader width={300} color="#188ba8" />
        </div>
      );
    }

    const { events, pois, intensityMap, selectedRows } = this.state;

    return (
      <div className="w-100 h-100 position-relative">
        <div className="position-relative mx-5 h-auto mt-4">
          <div className="d-flex w-100">
            <Scrollbars className="w-100 h-100" style={{ minHeight: '410px' }}>
              <table className="table table-hover border w-100">
                <thead className="bg-dark text-white">
                  <tr>
                    <th>
                      <input type="checkbox"
                        checked={selectedRows.All(x => x === true)}
                        onChange={(e) => {
                          let bool = e.currentTarget.checked;
                          if (e.currentTarget.checked)
                            selectedRows.fill(true);
                          else
                            selectedRows.fill(false);
                          // console.log(selectedRows.Average());
                          this.setState({ selectedRows: selectedRows });
                        }}
                      />
                    </th>
                    <th className="text-center">Date</th>
                    <th className="text-center">Time</th>
                    <th className="text-center">Events</th>
                    <th>Location (Lat, Lon)</th>
                  </tr>
                </thead>
                <tbody style={{ cursor: "pointer" }}>
                  {events!.ToArray().map((e, i) => (
                    <tr key={i} style={{ userSelect: "none" }}
                      onClick={(e) => {
                        selectedRows[i] = !selectedRows[i];
                        this.setState({ selectedRows: selectedRows })
                      }}
                    >
                      <td>
                        <input type="checkbox"
                          checked={selectedRows[i]}
                          onChange={(e) => {
                            selectedRows[i] = !selectedRows[i]
                            this.setState({ selectedRows: selectedRows });
                          }}
                        />
                      </td>
                      <td className="text-center">{new Date(e.date).toString("MMMM d, yyyy")}</td>
                      <td className="text-center">{e.hour > 12 ? `${e.hour - 12} pm` : `${e.hour} am`}</td>
                      <td className="text-center">{e.events}</td>
                      <td className="text-monospace">
                        {`${pois[e.poi_id - 1].lat.toFixed(3)}, ${pois[e.poi_id - 1].lon.toFixed(3)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scrollbars>
            <div className="w-100 bg-white" style={{ maxHeight: "50vh" }}>
              <LineChart
                data={{
                  labels: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
                  datasets: [{
                    label: '2019',
                    data: [20, 18, 21, 22, 20, 18, 21, 22, 20, 18, 21, 22],
                  }, {
                    label: '2018',
                    data: [19, 16, 20, 20, 19, 16, 20, 20, 19, 16, 20, 20],
                  }]
                }}
              />
            </div>
          </div>
        </div>
        <div className="position-relative h-100" style={{ minHeight: 'calc(100vh - 55px)' }}>
          <GoogleMap center={{ lat: 45, lng: 45 }} markers={intensityMap} />
        </div>
      </div>
    );
  }
}

export default EventsPage;