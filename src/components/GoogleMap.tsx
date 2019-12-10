import React, { Component } from 'react';
import { Coords } from '../utils/types';
import CONF from '../resources/config.json';
import MarkerClusterer from '@google/markerclustererplus';
import {
  Map,
  Marker,
  InfoWindow,
  ProvidedProps,
  GoogleApiWrapper,
  MapProps
} from 'google-maps-react';

const mapStyle: google.maps.MapTypeStyle[] = require('../resources/map_style.json');

interface Props extends ProvidedProps {
  markers?: Array<{ coords: Coords, opacity: number }>;
  center?: Coords;
  opacities?: number[];
}
interface States {
  activeMarker?: any;
  showInfo: boolean;
  map?: google.maps.Map | google.maps.StreetViewPanorama;
}

class GoogleMap extends Component<Props, States> {
  private mapRef = React.createRef<Map>();
  constructor(props: Props) {
    super(props);
    this.state = {
      showInfo: false
    }
  }

  onMarkerSelect = (props: any, marker: any, e: any) => {
    this.setState({
      activeMarker: marker,
      showInfo: true
    });
  }

  onMapLoad = (mapProps?: MapProps, map?: google.maps.Map) => {
    const { markers: points } = this.props;

    if (!points || !map)
      return;

    map.setMapTypeId('terrain');

    let _markers: google.maps.Marker[] = [];

    let _customIcon = require("../resources/marker.png");
    points.map(x => {
      _markers.push(
        new google.maps.Marker({ position: x.coords, opacity: x.opacity, icon: _customIcon, clickable: false })
      );
    });

    let _clusterer = new MarkerClusterer(map, _markers, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      maxZoom: 8
    });

    this.setState({ map: map as google.maps.Map })
  }

  render() {
    const { showInfo, activeMarker: marker, map } = this.state;
    const { markers: points, google, center } = this.props;

    // define default center
    let _center: Coords = center ? center : { lat: 45, lng: 45 };

    // find the center point among all points
    if (points) {
      let midX = 0;
      let midY = 0;
      points.forEach(({ coords }) => {
        midX += coords.lat;
        midY += coords.lng;
      });
      _center.lat = midX / points.length;
      _center.lng = midY / points.length;
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
      }
    }

    return (
      <Map
        draggable
        ref={this.mapRef}
        maxZoom={10}
        minZoom={4}
        zoom={4}
        styles={mapStyle}
        scrollwheel={false}
        disableDoubleClickZoom={false}
        fullscreenControl={false}
        onReady={this.onMapLoad}
        initialCenter={_center}
        google={google}
      >
        {/* {points && points.map(({ coords, opacity }, i) => (
          <Marker
            key={i}
            clickable
            animation={google.maps.Animation.DROP}
            icon={require('../resources/marker_2.png')}
            onClick={this.onMarkerSelect} position={coords}
          />
        ))}
        {infoWin()} */}
      </Map>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: CONF.google.key,
  libraries: ['visualization']
})(GoogleMap)