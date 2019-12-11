import React, { useState, Component } from 'react';
import { HourlyStat, Stat } from '../utils/types';
import BarLoader from 'react-spinners/BarLoader';
import { LineChart, LineChartProps, BarChart } from '../components/chart-js';
import GoogleMap from '../components/GoogleMap';
import Fuse, { FuseOptions } from 'fuse.js';
import { commafy } from '../utils/processor';
import 'linqify';

interface States {
  rawData?: HourlyStat[]
  filteredData?: Stat[]
  viewIndexes: boolean[]
  page: number
  search?: Fuse<Stat, FuseOptions<Stat>>
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
    this.processData();
  }

  processData = async (page = 1) => {
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

    let _response = await fetch(
      `http://localhost:5555/stats/daily/10/${page}`
    );

    let filteredData: Stat[] = JSON.parse(await _response.text());
    filteredData.ForEach(x => {
      x.revenue = parseFloat(x.revenue.toString());
    })

    stats.forEach((x, i) => {
      x.revenue = parseFloat(x.revenue.toString());
    })

    console.log(`>> Fetched ${stats.length}`)

    this.setState({
      rawData: stats,
      filteredData: filteredData,
      viewIndexes: new Array<boolean>(filteredData.length).fill(false),
      page: page,
      search: new Fuse(filteredData.Select(x => {
        return { ...x, ...{ date: new Date(x.date).toString("ddd") } }
      }).ToArray(), { keys: ['date'] })
    });
  }

  pagination = (op: '+' | '-') => {
    const { page } = this.state;
    if (op === '+') {
      this.processData(page + 1);
    } else if (this.state.page > 1) {
      this.processData(page - 1);
    }
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

    let onNext = () => this.pagination('+');
    let onPrev = () => this.pagination('-');

    console.log(this.state.search!.search('mon'))

    return (
      <div className="w-100 h-100">
        <table className="table border table-hover table-centered mb-0">
          <thead className="shadow-bottom bg-white">
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
              <tr key={i} className="pointer font-noto" onClick={e => {
                viewIndexes[i] = !viewIndexes[i]
                this.setState({ viewIndexes: viewIndexes })
              }} >
                <td>
                  <input type="checkbox" checked={viewIndexes[i]}
                    onChange={e => {
                      viewIndexes[i] = e.currentTarget.checked;
                      this.setState({ viewIndexes: viewIndexes });
                    }}
                  />
                </td>
                <td>{new Date(x.date).toString('MMMM d, yyyy')}</td>
                <td>{commafy(x.impressions)}</td>
                <td>{x.clicks}</td>
                <td className="text-right">{commafy(parseFloat(x.revenue.toFixed(2)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="w-100 d-flex flex-agile">
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData.map(x => new Date(x.date).toString("dd MMM")),
                datasets: [{
                  label: "Clicks",
                  data: filteredData.GroupBy(x => x.date.toString()).Distinct().Select(x => x.Sum(x => x.clicks)).ToArray()
                }]
              }}
            />
          </div>
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData.map(x => new Date(x.date).toString("dd MMM")),
                datasets: [{
                  label: 'Impressions',
                  data: filteredData.GroupBy(x => x.date.toString()).Distinct().Select(x => x.Sum(x => x.impressions)).ToArray()
                }]
              }}
            />
          </div>
          <div className="w-100" style={{ height: '40vh' }}>
            <LineChart
              data={{
                labels: filteredData.map(x => new Date(x.date).toString("dd MMM")),
                datasets: [{
                  label: 'Revenue',
                  data: filteredData.GroupBy(x => x.date.toString()).Distinct().Select(x => x.Sum(x => x.revenue)).ToArray()
                }]
              }}
            />
          </div>
        </div>
        <div className="map">
          <GoogleMap center={{ lat: 45, lng: -90 }} />
        </div>
      </div>
    )
  }
}

export default StatsPage;