import React, { Component } from 'react';
import { HourlyStat, Stat, PoiType } from '../utils/types';
import BarLoader from 'react-spinners/BarLoader';
import { LineChart, BarChart } from '../components/chart-js';
import GoogleMap from '../components/GoogleMap';
import Fuse, { FuseOptions } from 'fuse.js';
import { commafy } from '../utils/processor';
import Scrollbars from 'react-custom-scrollbars';
import { Dictionary } from 'linqify';
import 'linqify';

const SortTypes = {
  HOUR: 0,
  DAY: 1,
  MONTH: 2
}

type SortEnum = 0 | 1 | 2;

interface States {
  rawData?: HourlyStat[];
  filteredData?: HourlyStat[];
  intensityMap?: Array<{
    poi: PoiType,
    clicks: number,
    impressions: number,
    revenue: number
  }>;
  sortType: SortEnum;
  mapViewType: "impressions" | "clicks" | "revenue";
  viewIndexes: boolean[];
  filtered: boolean;
  fuzzy?: Fuse<HourlyStat, FuseOptions<HourlyStat>>;
}

class StatsPage extends Component<any, States> {
  private FuzzyOption: FuseOptions<HourlyStat> = {
    keys: ['date'],
    threshold: 0.4
  }

  constructor(props: any) {
    super(props);
    this.state = {
      viewIndexes: [],
      sortType: 1,
      mapViewType: "impressions",
      filtered: false
    }
  }

  componentDidMount() {
    this.processData();
  }

  updateIntensityMap = async (rawData: HourlyStat[]) => {
    console.log(">> Generating intensity map...");
    let response = await fetch("http://localhost:5555/poi");

    if (response.status !== 200) return;

    let poi_list: PoiType[] = await response.json();

    let intensityMap = poi_list.map(poi => {
      return {
        poi: poi,
        clicks: rawData.Where(data => data.poi_id === poi.poi_id).Sum(data => data.clicks),
        impressions: rawData.Where(data => data.poi_id === poi.poi_id).Sum(data => data.impressions),
        revenue: rawData.Where(data => data.poi_id === poi.poi_id).Sum(data => data.revenue)
      }
    });
    console.log(">> Intensity map generated, updating sums...");

    let maxClicks = intensityMap.Max(data => data.clicks);
    let maxImpressions = intensityMap.Max(data => data.impressions);
    let maxRevenue = intensityMap.Max(data => data.revenue);

    intensityMap.forEach(data => {
      data.clicks = (1 / maxClicks) * data.clicks;
      data.impressions = (1 / maxImpressions) * data.impressions;
      data.revenue = (1 / maxRevenue) * data.revenue;
    });

    console.log(">> Sums updated");

    return intensityMap;
  }

  processData = async () => {
    // console.log(">> Fetching Data...");
    let response = await fetch("http://localhost:5555/stats/2017");

    if (response.status !== 200)
      return;

    let rawData: HourlyStat[] = await response.json();
    // console.log(">> Fetch Complete. Processing Data...");

    rawData.ForEach(x => {
      x.revenue = parseFloat(x.revenue.toString());
      x.impressions = parseFloat(x.impressions.toString());
      x.clicks = parseFloat(x.clicks.toString());
    });

    const filterPromise = this.filterData(this.state.sortType, rawData);
    const intensityMapPromise = this.updateIntensityMap(rawData);

    // filter and map intensity concurrently
    const [filteredData, intensityMap] = await Promise.all([filterPromise, intensityMapPromise]);
    console.log(filteredData);

    const _fuzzy = new Fuse<HourlyStat, FuseOptions<HourlyStat>>(
      filteredData as HourlyStat[],
      this.FuzzyOption
    );

    console.log(">> Processing complete, updating state...");

    this.setState({
      rawData: rawData,
      filteredData: _fuzzy.search('January') as HourlyStat[],
      filtered: true,
      intensityMap: intensityMap,
      fuzzy: _fuzzy,
    });
  }

  filterData = async (type: SortEnum, rawData: HourlyStat[], setState = false) => {
    let _filteredData: HourlyStat[] = [];

    switch (type) {
      case SortTypes.HOUR:
        _filteredData = rawData.Select(data => {
          data.date = new Date(data.date).toString("MMMM dd, yyyy");
          return data;
        }).ToArray();
        break;

      case SortTypes.DAY:
        _filteredData = rawData.GroupBy(d => new Date(d.date).toString("MMMM dd")).Distinct().Select(grp => ({
          date: grp.Key,
          clicks: grp.Sum(x => x.clicks),
          impressions: grp.Sum(x => x.impressions),
          revenue: grp.Sum(x => x.revenue),
        } as HourlyStat)).ToArray();

        break;

      default:
        break;
    }

    return _filteredData;
  }

  generateTable = (type: 0 | 1 | 2) => {
    const { filteredData } = this.state;
    if (!filteredData) return;

    switch (type) {
      case SortTypes.HOUR:
        return (
          <table className="table table-hover table-centered mb-0">
            <thead className="shadow-bottom bg-white" style={{ position: 'sticky', top: 0 }}>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((data, i) => (
                <tr key={i} className="pointer font-noto">
                  <td>{data.date}</td>
                  <td>{data.hour}</td>
                  <td>{data.clicks}</td>
                  <td>{data.impressions}</td>
                  <td>{data.revenue.toFixed(2)}</td>
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
                <th>Date</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((data, i) => (
                <tr key={i} className="pointer font-noto">
                  <td>{data.date}</td>
                  <td>{data.clicks}</td>
                  <td>{data.impressions}</td>
                  <td>{data.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return;
    }
  }

  render() {
    const { rawData, filteredData, sortType, fuzzy, intensityMap, filtered } = this.state;
    if (!rawData || !filteredData) {
      return (
        <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
          <big>Loading dataset...</big>
          <BarLoader width={300} color="#188ba8" />
        </div>
      );
    }

    let _searchFieldRef = React.createRef<HTMLInputElement>();

    let _search = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const { current } = _searchFieldRef;
      if (current!.value !== '') {
        let _filteredData = fuzzy!.search(_searchFieldRef.current!.value);
        this.setState({ 
          filteredData: _filteredData as HourlyStat[],
          filtered: true
        });
      }
    }

    return (
      <div className="w-100 h-100">
        <div className="container">
          <form className="py-4 px-1 d-flex" onSubmit={_search}>
            {/* <div className="form-row"> */}
            {/* <select defaultValue="_meta" className="custom-select col-2">
                <option value="_meta">Date</option>
                <option value="impressions">Impression</option>
                <option value="clicks">Clicks</option>
                <option value="revenue">Revenue</option>
                <option>Location</option>
              </select> */}
            {/* <div className="col-1" /> */}
            <input
              ref={_searchFieldRef}
              type="search"
              name="query"
              defaultValue="january"
              placeholder="Search Month"
              className="form-control flex-grow-1"
            />
            {filtered && (
              <button className="btn btn-white" onClick={e => {
                this.filterData(sortType, rawData).then(_filteredData => {
                  _searchFieldRef.current!.value = "";
                  this.setState({
                    filteredData: _filteredData,
                    filtered: false
                  })
                })
              }}>
                <i className="fas fa-times" />
              </button>
            )}
            {/* </div> */}
          </form>
          <Scrollbars className="w-100 border shadow" style={{ height: "70vh" }} autoHide>
            {this.generateTable(sortType)}
          </Scrollbars>
          <div className="d-flex justify-content-between mt-2">
            <div className="btn-group btn-group-toolbar">
              <button className="btn btn-light" title="Copy"><i className="far fa-clipboard" /></button>
              <button className="btn btn-light" title="Save as Excel" onClick={e => {
                if (window.confirm('Save as excel?')) {
                  // TODO: prompt save file on confirm
                }
              }}>
                <i className="fas fa-file-excel" />
              </button>
            </div>
            <div>
              <select defaultValue={sortType}
                className="custom-select"
                onChange={({ currentTarget: { value } }) => {
                  this.filterData(parseInt(value) as SortEnum, rawData, true).then(_filteredData => {
                    this.setState({
                      filteredData: _filteredData,
                      fuzzy: new Fuse(_filteredData, this.FuzzyOption),
                      sortType: parseInt(value) as SortEnum
                    });
                  })
                }}
              >
                <option value={SortTypes.HOUR}>Hour</option>
                <option value={SortTypes.DAY}>Day</option>
                <option value={SortTypes.MONTH}>Month</option>
              </select>
            </div>
          </div>
        </div>
        <div className="dropdown-divider" />
        <div className="w-100 d-flex flex-column">
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData!.Select(x => x.date).Distinct().ToArray(),
                datasets: [{
                  label: "2017",
                  data: filteredData!.GroupBy(x => x.date).Distinct().Select(x => x.Sum(x => x.clicks)).ToArray()
                }]
              }}
              options={{
                title: {
                  display: true,
                  text: "Clicks",
                  fontSize: 18
                },
                legend: { display: false }
              }}
            />
          </div>
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData!.Select(x => x.date).Distinct().ToArray(),
                datasets: [{
                  label: '2017',
                  data: filteredData!.GroupBy(x => x.date).Distinct().Select(grp => grp.Where(x => x.date === grp.Key).Sum(x => x.impressions)).ToArray()
                }]
              }}
              options={{
                title: {
                  display: true,
                  text: "Impressions",
                  fontSize: 18
                },
                legend: { display: false }
              }}
            />
          </div>
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData!.Select(x => x.date).Distinct().ToArray(),
                datasets: [{
                  label: '2017',
                  data: filteredData!.GroupBy(x => x.date).Distinct().Select(x => x.Sum(x => x.revenue)).ToArray()
                }]
              }}
              options={{
                title: {
                  display: true,
                  text: "Revenue",
                  fontSize: 18
                },
                legend: { display: false }
              }}
            />
          </div>
        </div>
        <div className="map">
          <div className="position-relative">
            <div className="shadow" style={{ position: 'absolute', right: 10, top: 10, zIndex: 10 }}>
              <select
                className="custom-select"
                value={this.state.mapViewType}
                onChange={e => {
                  this.setState({ mapViewType: e.currentTarget.value as "clicks" | "impressions" | "revenue" });
                  this.forceUpdate();
                  console.log(">> Changing state");
                }}
              >
                <option value="clicks">Clicks</option>
                <option value="impressions">Impressions</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>
          <GoogleMap center={{ lat: 45, lng: -90 }} markers={
            intensityMap!.map(data => ({
              coords: { lat: data.poi.lat, lng: data.poi.lon },
              opacity: data[this.state.mapViewType],
              title: data.poi.name
            }))}
          />
        </div>
      </div>
    )
  }
}

export default StatsPage;