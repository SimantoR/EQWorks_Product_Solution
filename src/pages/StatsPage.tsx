import React, { useState, Component } from 'react';
import { StatType } from '../utils/types';
import BarLoader from 'react-spinners/BarLoader';
import 'linqify';

interface States {
  rawData?: StatType[];
  filteredData?: Array<{
    date: Date,
    clicks: number
    impressions: number
    revenue: number
  }>;
  viewIndexes: boolean[];
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
      viewIndexes: []
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async (limit?: number) => {
    console.log(">> Fetching Data <<");
    let response = await fetch(
      'http://localhost:5555/stats/hourly'
    );

    if (response.status !== 200)
      return;

    let stats: StatType[];
    try {
      stats = JSON.parse(await response.text());
    } catch (ex) {
      console.log(ex);
      return;
    }

    // set limit of limit is provided
    if (limit)
      stats = stats.Take(limit).ToArray();

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

    this.setState({
      rawData: stats,
      filteredData: filteredData,
      viewIndexes: new Array<boolean>(filteredData.length).fill(false)
    });
  }

  render() {
    const { rawData, filteredData, viewIndexes } = this.state;
    if (!rawData || !filteredData) {
      return (
        <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
          <big>Loading dataset...</big>
          <BarLoader width={300} color="#188ba8" />
        </div>
      );
    }

    return (
      <div className="w-100 h-100 p-3">
        <div className="btn-group btn-group-toolbar">
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
        <table className="table border table-hover table-centered mt-2">
          <thead className="shadow" style={{ position: 'sticky', top: 0 }}>
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
      </div>
    )
  }
}

export default StatsPage;