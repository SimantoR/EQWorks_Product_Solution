import React, { Component } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

//#region PropTypes
export var ColorPalettes = [
  { foreground: '#F4A460', background: 'rgba(244, 165, 96, 0.1)' }, // orange
  { foreground: '#DEB887', background: 'rgba(222, 184, 135, 0.1)' }, // dark-orange
  { foreground: '#bef073', background: 'rgba(190, 240, 115, 0.1)' }, // lime
  { foreground: '#bd84fa', background: 'rgba(189, 132, 250, 0.1)' } // purple
]

export interface ChartDatasetProps {
  label: string,
  data: Array<number>
  backgroundColor?: string | Array<string>,
  borderColor?: string,
  pointRadius?: number,
  pointBackgroundColor?: string,
  lineTension?: number,
  borderWidth?: number,
}

export interface LineChartProps {
  labels: Array<string>,
  datasets: Array<ChartDatasetProps>
};

export interface ChartOptions {
  title?: {
    display?: boolean,
    fontSize?: number,
    text?: string,
    position?: "top" | "bottom" | "left" | "right"
  },
  animation?: boolean,
  responsive?: boolean,
  height?: number,
  legend?: {
    display?: boolean,
    position?: string
  },
  tooltips?: {
    mode: 'label' | null
  },
  maintainAspectRatio?: boolean,
  scales?: {
    yAxes?: Array<{
      position?: 'left' | 'right' | 'top' | 'bottom',
      ticks?: {
        beginAtZero: boolean,
        min?: number,
        max?: number
      }
    }>
  }
};
//#endregion

type OptionsProps = { title?: string, height?: number, legendPos?: 'top' | 'bottom' | 'left' | 'right' }

interface Data {
  labels: Array<string>,
  datasets: Array<{
    label: string,
    data: Array<number>
    backgroundColor?: string | Array<string>,
    borderColor?: string
  }>
}

interface ChartProps {
  className?: string
  options?: Partial<ChartOptions>
  data: Data
}

const colorPalettes = [
  { foreground: '#F4A460', background: 'rgba(244, 165, 96, 0.1)' }, // orange
  { foreground: '#DEB887', background: 'rgba(222, 184, 135, 0.1)' }, // dark-orange
  { foreground: '#bd84fa', background: 'rgba(189, 132, 250, 0.1)' }, // purple
  { foreground: '#bef073', background: 'rgba(190, 240, 115, 0.1)' } // lime
]

export class BarChart extends Component<ChartProps> {
  genDatasets = () => {
    const { data } = this.props;

    let chartProps: LineChartProps = {
      labels: data.labels,
      datasets: data.datasets.map((d, i) => {
        return {
          label: d.label,
          data: d.data,
          backgroundColor: colorPalettes[i].foreground,
          borderColor: colorPalettes[i].foreground,
          pointRadius: 4,
          borderWidth: 2
        } as ChartDatasetProps
      })
    }

    return chartProps;
  }

  genOptions = (props: OptionsProps): ChartOptions => {
    // const { options: _options } = this.props;
    let options = {
      title: props.title && {
        display: true,
        fontSize: 24,
        text: props.title
      },
      legend: {
        position: props.legendPos ? props.legendPos : "top"
      },
      tooltips: {
        mode: "label"
      },
      maintainAspectRatio: false,
      responsive: true,
      height: props.height && props.height,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    } as ChartOptions;

    if (this.props.options)
      options = { ...options, ...this.props.options };

    return options;
  }

  render() {
    // const { className } = this.props;

    let datasets = this.genDatasets();
    let options = this.genOptions({});

    return (
      <Bar data={datasets} options={options} />
    );
  }
}

export class LineChart extends Component<ChartProps> {
  genDatasets = () => {
    const { data } = this.props;

    let chartProps: LineChartProps = {
      labels: data.labels,
      datasets: data.datasets.map((d, i) => {
        return {
          label: d.label,
          data: d.data,
          backgroundColor: colorPalettes[i].background,
          borderColor: colorPalettes[i].foreground,
          pointRadius: 2.5,
          borderWidth: 2
        } as ChartDatasetProps
      })
    }

    return chartProps;
  }

  genOptions = (props: OptionsProps): ChartOptions => {
    // const { options: opts } = this.props;

    let options = {
      title: props.title && {
        display: true,
        fontSize: 24,
        text: props.title
      },
      legend: {
        position: props.legendPos ? props.legendPos : "top"
      },
      tooltips: {
        mode: "label"
      },
      maintainAspectRatio: false,
      responsive: true,
      height: props.height && props.height,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    } as ChartOptions

    // if (opts)
    //   options = { ...options, ...opts }

    return options
  }

  render() {
    const { options: opts } = this.props

    const datasets = this.genDatasets();
    // let options = opts ? opts : this.genOptions({});
    const options = Object.assign(this.genOptions({}), opts);

    return (
      <Line
        // plugins={[ChartDataLabels]}
        data={datasets}
        options={options}
      />
    );
  }
}