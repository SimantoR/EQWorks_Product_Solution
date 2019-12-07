import React, { Component } from 'react';
import { Bar, Line } from 'react-chartjs-2';

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
    display: boolean,
    fontSize?: number,
    text: string
  },
  animation?: boolean,
  responsive?: boolean,
  height?: number,
  legend?: {
    position?: string
  },
  tooltips?: {
    mode: 'label' | null
  },
  maintainAspectRatio?: boolean,
  scales?: {
    yAxis?: Array<{
      position?: 'left' | 'right' | 'top' | 'bottom',
      ticks?: {
        beginAtZero: boolean
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
  className?: string;
  animation?: boolean;
  options?: ChartOptions
  data: Data;
}

export class BarChart extends Component<ChartProps> {
  private colorPalettes = [
    { foreground: '#F4A460', background: 'rgba(244, 165, 96, 0.6)' }, // orange
    { foreground: '#DEB887', background: 'rgba(222, 184, 135, 0.6)' }, // dark-orange
    { foreground: '#bef073', background: 'rgba(190, 240, 115, 0.6)' }, // lime
    { foreground: '#bd84fa', background: 'rgba(189, 132, 250, 0.6)' } // purple
  ]

  genDatasets = () => {
    const { data } = this.props;

    let chartProps: LineChartProps = {
      labels: data.labels,
      datasets: data.datasets.map((d, i) => {
        return {
          label: d.label,
          data: d.data,
          backgroundColor: this.colorPalettes[i].foreground,
          borderColor: this.colorPalettes[i].foreground,
          pointRadius: 4,
          lineTension: 0.4,
          borderWidth: 2
        } as ChartDatasetProps
      })
    }

    return chartProps;
  }

  genOptions = (props: OptionsProps): ChartOptions => {
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
      maintainAspectRatio: true,
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

    if (!this.props.animation) {
      options.animation = false;
    }

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
  private colorPalettes = [
    { foreground: '#F4A460', background: 'rgba(244, 165, 96, 0.1)' }, // orange
    { foreground: '#DEB887', background: 'rgba(222, 184, 135, 0.1)' }, // dark-orange
    { foreground: '#bef073', background: 'rgba(190, 240, 115, 0.1)' }, // lime
    { foreground: '#bd84fa', background: 'rgba(189, 132, 250, 0.1)' } // purple
  ]

  constructor(props: ChartProps) {
    super(props);
  }

  genDatasets = () => {
    const { data } = this.props;

    let chartProps: LineChartProps = {
      labels: data.labels,
      datasets: data.datasets.map((d, i) => {
        return {
          label: d.label,
          data: d.data,
          backgroundColor: this.colorPalettes[i].background,
          borderColor: this.colorPalettes[i].foreground,
          pointRadius: 2.5,
          lineTension: 0.1,
          borderWidth: 2
        } as ChartDatasetProps
      })
    }

    return chartProps;
  }

  genOptions = (props: OptionsProps): ChartOptions => {
    const { animation, options: opts } = this.props;

    // If custom options exist
    if (opts)
      return opts;

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

    // Set animation
    if (!animation)
      options.animation = false

    return options;
  }

  render() {
    const { options: opts } = this.props;

    let datasets = this.genDatasets();
    let options = opts ? opts : this.genOptions({});

    return (
      <Line data={datasets} options={options} />
    );
  }
}