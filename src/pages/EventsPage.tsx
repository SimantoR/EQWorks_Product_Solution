import React, { Component } from 'react';
import Scrollbars from 'react-custom-scrollbars';
import GoogleMap from '../components/GoogleMap';
import { Coords } from '../utils/types';
import { PoiType, EventType } from '../utils/types';
import { LineChart, BarChart } from '../components/chart-js';
import BarLoader from 'react-spinners/BarLoader';
import Fuse, { FuseOptions } from 'fuse.js';
import {
  List, Dictionary
} from 'linqify';

const SortTypes = {
  HOUR: 0,
  DAY: 1,
  MONTH: 2
}

interface States {
  events?: EventType[];
  pois: PoiType[];
  intensityMap: _MarkerProps[];
  filteredData?: EventType[];
  selectedRows: boolean[];
  sortType: number;
  fuzzy?: Fuse<EventType, FuseOptions<EventType>>
}

type _MarkerProps = { coords: Coords, opacity: number };

class EventsPage extends Component<any, States> {
  constructor(props: any) {
    super(props);
    this.state = {
      pois: [],
      intensityMap: [],
      selectedRows: [],
      sortType: SortTypes.HOUR
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    // two api calls started to save time
    const event_promise = fetch("http://localhost:5555/events/yearly/2017");
    const poi_promise = fetch('http://localhost:5555/poi');

    // wait on both calls to finish and get their responses
    const [event_response, poi_response] = await Promise.all([event_promise, poi_promise]);

    // if any of the api calls failed, show error on log and exit out of function
    if (event_response.status !== 200 || poi_response.status !== 200) {
      console.error("Failed to fetch data");
      return;
    }

    // wait for events and pois to be received from http call
    const [eventList, poiArray] = await Promise.all<EventType[], PoiType[]>(
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
      intensityMap[i] = {
        coords: { lat: poiArray[i].lat, lng: poiArray[i].lon },
        opacity: (1 / maxEventCount) * eventCountMap[i]
      };
    }

    this.setState(prevState => ({
      events: eventList,
      pois: poiArray,
      intensityMap: intensityMap,
      filteredData: eventList,
      selectedRows: new Array<boolean>(eventList.Count()).fill(false),
      fuzzy: new Fuse(
        eventList.Select(x => {
          return {
            ...x,
            _meta: new Date(x.date).toString("MMMM MMM")
          }
        }).ToArray(), {
          keys: ['_meta'],
          threshold: 0.4
        } as FuseOptions<EventType>)
    }));
  }

  sortDataset = (type: number, data?: EventType[]) => {
    const { events } = this.state;

    if (!events) return;

    let _data: EventType[] = data || events;

    switch (type) {
      case SortTypes.DAY:
        _data = _data.GroupBy(x => new Date(x.date).toDateString()).Distinct().Select(grp => {
          return {
            date: grp.Key,
            events: grp.Sum(x => x.events!)
          }
        }).ToArray();
        break;
      case SortTypes.MONTH:
        _data = _data.GroupBy(x => new Date(x.date).toString("MMMM, yyyy")).Distinct().Select(grp => {
          return {
            date: grp.Key,
            events: grp.Sum(x => x.events!)
          } as EventType
        }).ToArray();
        break;
    }
    this.setState({ filteredData: _data, sortType: type });
  }

  tableGenerator = (sortType: number) => {
    const { filteredData, pois, selectedRows } = this.state;

    if (!filteredData || !pois)
      return;

    switch (sortType) {
      case SortTypes.HOUR:
        return (
          <table className="table table-hover table-centered mb-0">
            <thead className="shadow-bottom bg-white" style={{ position: 'sticky', top: 0 }}>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={selectedRows.All(x => x === true)}
                    onChange={(e) => {
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
              {filteredData.ToArray().map((e, i) => (
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
                  <td className="text-center">{new Date(e.date).toString("MMMM dd, yyyy")}</td>
                  <td className="text-center">{e.hour! > 12 ? `${e.hour! - 12} pm` : `${e.hour!} am`}</td>
                  <td className="text-center">{e.events}</td>
                  <td className="text-monospace">
                    {`${pois[e.poi_id! - 1].lat.toFixed(3)}, ${pois[e.poi_id! - 1].lon.toFixed(3)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case SortTypes.DAY:
        return (
          <table className="table table-hover table-centered mb-0">
            <thead className="shadow-bottom bg-white" style={{ position: 'sticky', top: 0 }}>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={selectedRows.All(x => x === true)}
                    onChange={(e) => {
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
                {/* <th className="text-center">Time</th> */}
                <th className="text-center">Events</th>
                {/* <th>Location (Lat, Lon)</th> */}
              </tr>
            </thead>
            <tbody style={{ cursor: "pointer" }}>
              {filteredData.ToArray().map((e, i) => (
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
                  <td className="text-center">{new Date(e.date).toString("MMMM dd, yyyy")}</td>
                  {/* <td className="text-center">{e.hour > 12 ? `${e.hour - 12} pm` : `${e.hour} am`}</td> */}
                  <td className="text-center">{e.events}</td>
                  {/* <td className="text-monospace">
                    {`${pois[e.poi_id - 1].lat.toFixed(3)}, ${pois[e.poi_id - 1].lon.toFixed(3)}`}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )
      case SortTypes.MONTH:
        return (
          <table className="table table-hover table-centered mb-0">
            <thead className="shadow-bottom bg-white" style={{ position: 'sticky', top: 0 }}>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={selectedRows.All(x => x === true)}
                    onChange={(e) => {
                      if (e.currentTarget.checked)
                        selectedRows.fill(true);
                      else
                        selectedRows.fill(false);
                      // console.log(selectedRows.Average());
                      this.setState({ selectedRows: selectedRows });
                    }}
                  />
                </th>
                <th className="text-center">Month</th>
                {/* <th className="text-center">Time</th> */}
                <th className="text-center">Events</th>
                {/* <th>Location (Lat, Lon)</th> */}
              </tr>
            </thead>
            <tbody style={{ cursor: "pointer" }}>
              {filteredData!.ToArray().map((e, i) => (
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
                  <td className="text-center">{e.date}</td>
                  {/* <td className="text-center">{e.hour > 12 ? `${e.hour - 12} pm` : `${e.hour} am`}</td> */}
                  <td className="text-center">{e.events}</td>
                  {/* <td className="text-monospace">
                        {`${pois[e.poi_id - 1].lat.toFixed(3)}, ${pois[e.poi_id - 1].lon.toFixed(3)}`}
                      </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )
      default:
        break;
    }
  }

  render() {
    const { intensityMap, filteredData, sortType } = this.state;

    const isLoaded = intensityMap && filteredData;

    if (!isLoaded) {
      console.warn('No data found yet');
      return (
        <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
          <big>Loading dataset...</big>
          <BarLoader width={300} color="#188ba8" />
        </div>
      );
    }

    const _searchFieldRef = React.createRef<HTMLInputElement>();
    const _search = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const { fuzzy } = this.state;
      if (!fuzzy)
        return;
      const { current } = _searchFieldRef;
      if (current!.value === '') {
        this.sortDataset(sortType);
        return;
      }
      let _filteredData = fuzzy.search(_searchFieldRef.current!.value);
      _searchFieldRef.current!.value = "";
      this.sortDataset(sortType, _filteredData as EventType[]);
    }

    return (
      <div className="w-100 h-100 position-relative">
        <div className="position-relative h-auto">
          <form className="py-4 container" onSubmit={_search}>
            <div className="form-row mx-0">
              <select defaultValue="_meta" className="custom-select col-2 shadow">
                <option value="_meta">Date</option>
                <option value="impressions">Impression</option>
                <option value="clicks">Clicks</option>
                <option value="revenue">Revenue</option>
                <option>Location</option>
              </select>
              <div className="col-1" />
              <input
                ref={_searchFieldRef}
                type="search"
                name="query"
                placeholder="Query"
                className="form-control col-9 shadow"
              />
            </div>
          </form>
          <div className="d-flex flex-column w-100 container">
            <Scrollbars className="w-100 border shadow" style={{ height: "70vh" }}>
              {this.tableGenerator(sortType)}
            </Scrollbars>
            <div className="d-flex justify-content-between mt-2">
              <div className="btn-group btn-group-toolbar">
                <button className="btn btn-white" title="Copy"><i className="far fa-clipboard" /></button>
                <button className="btn btn-white" title="Save as Excel" onClick={e => {
                  if (window.confirm('Save as excel?')) {
                    // TODO: prompt save file on confirm
                  }
                }}>
                  <i className="fas fa-file-excel" />
                </button>
              </div>
              <div>
                <select defaultValue={sortType} onChange={({ currentTarget: { value } }) => this.sortDataset(parseInt(value))} className="custom-select shadow">
                  <option value={SortTypes.HOUR}>Hour</option>
                  <option value={SortTypes.DAY}>Day</option>
                  <option value={SortTypes.MONTH}>Month</option>
                </select>
              </div>
              {/* <div className="w-auto">
                <input type="number" className="form-control rounded" defaultValue={1} />
              </div>
              <div className="btn-group btn-group-toolbar">
                <button className="btn btn-light"><i className="fas fa-arrow-circle-left" /></button>
                <button className="btn btn-light"><i className="fas fa-arrow-circle-right" /></button>
              </div> */}
            </div>
          </div>
          <div className="w-100 bg-white p-3" style={{ height: "50vh" }}>
            <div className="border shadow h-100">
              <BarChart
                data={{
                  labels: filteredData!.Select(x => {
                    if (sortType === SortTypes.MONTH)
                      return x.date;
                    else
                      return new Date(x.date).toString("MMM dd");
                  }).Distinct().ToArray(),
                  datasets: [{
                    label: '2017',
                    data: filteredData!.GroupBy(x => x.date).Select(x => x.Sum(y => y.events!)).ToArray()
                    // data: filteredData!.GroupBy(x => new Date(x.date).toString("MMM dd")).Distinct().Select(group => {
                    //   const output = group.Sum(x => parseInt(x.events!.toString()));
                    //   return output;
                    // }).ToArray()
                  }]
                }}
                options={{
                  title: {
                    display: true,
                    text: "Events",
                    fontSize: 26
                  },
                  legend: {
                    display: false
                  },
                  animation: false
                }}
              />
            </div>
          </div>
        </div>
        <div className="position-relative h-100" style={{ minHeight: 'calc(100vh - 55px)' }}>
          {/* <div style={{position: "absolute", top: 120, left: 10, zIndex: 10}}>
            <button className="btn btn-white">Color</button>
          </div> */}
          <GoogleMap center={{ lat: 45, lng: 45 }} markers={intensityMap} />
        </div>
      </div>
    );
  }
}

export default EventsPage;