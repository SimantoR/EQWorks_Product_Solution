import React, { Component } from 'react';
import { Coords } from '../utils/types';
import CONF from '../resources/config.json';
import { lerpColor } from '../utils/processor';
import MarkerClusterer from '@google/markerclustererplus';
import {
  Map,
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

    map!.setMapTypeId("terrain");

    if (!points || !map)
      return;

    let getIcon = (v: number) => {
      return {
        path: "M-20,0a20,20 0 1,0 40,0a20,20 0 1,0 -40,0",
        fillColor: lerpColor('#FF0000', '#55f27f', v),
        fillOpacity: v,
        anchor: new google.maps.Point(0, 0),
        strokeWeight: 0,
        scale: 1
      }
    }

    let _markers: google.maps.Marker[] = [];
    points.forEach(x => {
      let _intensity = Math.pow(x.opacity, 2);
      _markers.push(
        new google.maps.Marker({
          position: x.coords,
          opacity: 1,
          icon: getIcon(_intensity),
          clickable: false,
          label: { 
            text: x.opacity.toFixed(2), 
            color: "#ffffff",
            fontWeight: "bold" } as google.maps.MarkerLabel
        })
      );
    });

    new MarkerClusterer(map, _markers, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      maxZoom: 8
    });

    this.setState({ map: map as google.maps.Map })
  }

  render() {
    // const { showInfo, activeMarker: marker, map } = this.state;
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

    return (
      <Map
        draggable
        ref={this.mapRef}
        maxZoom={12}
        minZoom={4}
        zoom={4}
        styles={mapStyle}
        scrollwheel={false}
        disableDoubleClickZoom={false}
        fullscreenControl={false}
        onReady={this.onMapLoad}
        initialCenter={_center}
        google={google}
      />
    );
  }
}

export default GoogleApiWrapper({
  apiKey: CONF.google.key,
  libraries: ['visualization']
})(GoogleMap)