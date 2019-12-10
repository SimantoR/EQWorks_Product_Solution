import React, { useState, Component } from 'react';
import { HourlyStat } from '../utils/types';
import BarLoader from 'react-spinners/BarLoader';
import 'linqify';
import GoogleMap from '../components/GoogleMap';

interface States {
  rawData?: HourlyStat[];
  filteredData?: Array<{
    date: Date,
    clicks: number
    impressions: number
    revenue: number
  }>;
  viewIndexes: boolean[];
  page: number
}

function commafy(num: number) {
  var str = num.toString().split('.');
  if (str[0].length >= 4) {
    str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  if (str[1] && str[1].length >= 4) {
    str[1] = str[1].replace(/(\d{3})/g, '$1 ');
  }
  return str.join('.');
}

class StatsPage extends Component<any, States> {
  constructor(props: any) {
    super(props);
    this.state = {
      viewIndexes: [],
      page: 0
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async (page = 1) => {
    console.log(">> Fetching Data <<");
    let response = await fetch(
      `http://localhost:5555/stats/hourly/200/${page}`
    );

    if (response.status !== 200)
      return;

    let stats: HourlyStat[];
    try {
      stats = JSON.parse(await response.text());
    } catch (ex) {
      console.log(ex);
      return;
    }

    // group data by date
    let filteredData = stats.GroupBy(x => x.date).Distinct().Select(group => ({
      date: new Date(group.Key),
      clicks: group.Sum(x => x.clicks),
      impressions: group.Sum(x => x.impressions),
      revenue: group.Sum(x => parseFloat(x.revenue.toString()))
    })).ToArray();

    // convert date string to date object
    // for some reason revenue remains string and not number after JSON convert
    stats.forEach((x, i) => {
      x.date = new Date(x.date);
      x.revenue = parseFloat(x.revenue.toString());
    });

    console.log(`>> Fetched ${stats.length}`);

    this.setState({
      rawData: stats,
      filteredData: filteredData,
      viewIndexes: new Array<boolean>(filteredData.length).fill(false),
      page: page
    });
  }

  render() {
    const { rawData, filteredData, viewIndexes, page } = this.state;
    if (!rawData || !filteredData) {
      return (
        <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
          <big>Loading dataset...</big>
          <BarLoader width={300} color="#188ba8" />
        </div>
      );
    }

    let onNext = () => {
      this.fetchData(page + 1);
    }
    let onPrev = () => {
      if (page > 1)
        this.fetchData(page - 1);
    }

    let showAggregate = () => {
      if (viewIndexes.Any(x => x === true)) {
        // TODO: create an intensity map based on impressions
        return <GoogleMap />
      }
    }

    return (
      <div className="w-100 h-100">
        <div className="d-flex m-2">
          <div className="btn-group btn-group-lg btn-group-toolbar">
            {/* <button className="btn btn-light">View Raw</button> */}
            <button className="btn btn-light" title="Copy"><i className="far fa-clipboard" /></button>
            <button className="btn btn-light" title="Save as Excel" onClick={e => {
              if (window.confirm('Save as excel?')) {
                // TODO: prompt save file on confirm
              }
            }}>
              <i className="fas fa-file-excel" />
            </button>
          </div>
          <div className="ml-auto btn-group btn-group-lg btn-group-toolbar">
            <button className="btn btn-light" onClick={onPrev}><i className="fas fa-arrow-circle-left" /></button>
            <div className="align-self-center pr-2 pl-1">Page: {page}</div>
            <button className="btn btn-light" onClick={onNext}><i className="fas fa-arrow-circle-right" /></button>
          </div>
        </div>
        <table className="table border table-hover table-centered mb-0">
          <thead className="shadow bg-white" style={{ position: 'sticky', top: 0 }}>
            <tr>
              <th>
                View All{' '}
                <input type="checkbox" onClick={e => {
                  viewIndexes.fill(e.currentTarget.checked);
                  this.setState({
                    viewIndexes: viewIndexes
                  });
                }} />
              </th>
              <th>Date</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th className="text-right">$ Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((x, i) => (
              <tr key={i} className="pointer font-noto" >
                <td>
                  <input type="checkbox" checked={viewIndexes[i]}
                    onChange={e => {
                      viewIndexes[i] = e.currentTarget.checked;
                      this.setState({ viewIndexes: viewIndexes });
                    }}
                  />
                </td>
                <td>{(x.date as Date).toString('MMMM d, yyyy')}</td>
                <td>{commafy(x.impressions)}</td>
                <td>{x.clicks}</td>
                <td className="text-right">{commafy(parseFloat(x.revenue.toFixed(2)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="map">
          <GoogleMap center={{ lat: 45, lng: -90 }} />
        </div>
      </div>
    )
  }
}

export default StatsPage;