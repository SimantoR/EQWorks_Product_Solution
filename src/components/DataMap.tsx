import React, { Component } from 'react';
import { Coords } from '../utils/types';
import CONF from '../resources/config.json';
// import MapStyle from '../resources/map_style.json';
import {
  Map,
  Marker,
  InfoWindow,
  ProvidedProps,
  GoogleApiWrapper
} from 'google-maps-react';

interface Props extends ProvidedProps {
  points?: Coords[]

}
interface States {
  marker?: any;
  showInfo: boolean;
  map?: google.maps.Map | google.maps.StreetViewPanorama;
}

class DataMap extends Component<Props, States> {
  private mapRef = React.createRef<Map>();
  constructor(props: Props) {
    super(props);
    this.state = {
      showInfo: false
    }
  }

  onMarkerSelect = (props: any, marker: any, e: any) => {
    console.log(`Marker type: ${typeof (marker)}`);
    console.log(marker);
    this.setState({
      marker: marker,
      showInfo: true
    });
  }

  render() {
    const { showInfo, marker, map } = this.state;
    const { points, google } = this.props;

    // define default center
    let center: Coords = { lat: 45, lng: 45 }

    // find the center point among all points
    if (points) {
      let midX = 0;
      let midY = 0;
      points.forEach(({ lat, lng }) => {
        midX += lat;
        midY += lng;
      });
      center.lat = midX / points.length;
      center.lng = midY / points.length;
    }

    let infoWin = () => {
      if (map && marker) {
        console.log('Map and Marker found');
        return (
          <InfoWindow
            google={google}
            visible={showInfo}
            marker={marker}
            map={map as google.maps.Map}
          >
            <big className="my-0">
              {`${marker.position.lat().toFixed(3)}, ${marker.position.lng().toFixed(3)}`}
            </big>
          </InfoWindow>
        );
      } else {
        return null;
      }
    }

    return (
      <Map
        draggable
        ref={this.mapRef}
        zoom={4}
        // styles={MapStyle}
        onReady={(mapProps, map) => {
          this.setState({ map: map as google.maps.Map })
        }}
        initialCenter={center}
        google={google}
      >
        {points && marker && points.map((pos, i) => (
          <Marker key={i} clickable onClick={this.onMarkerSelect} position={pos} />
        ))}
        {infoWin()}
      </Map>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: CONF.google.key
})(DataMap)