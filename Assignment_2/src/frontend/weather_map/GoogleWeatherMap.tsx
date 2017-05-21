import * as React from 'react';

import { GeoCodingService } from './utils/GeoCodingService';
import { MonitoredLocationInformation } from '../model/MonitoredLocationInformation';
import { WeatherLocationData } from '../../model/WeatherLocationData';
import { WeatherMapState } from './WeatherMapState';

interface GoogleWeatherMapProps {
  readonly weatherDataMap: Map<string, MonitoredLocationInformation>;
  readonly locationList: string[];
}

interface LocationMarkerInformation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  temp: number|null;
  rainfall: number|null;
}

class GoogleWeatherMap extends React.Component<GoogleWeatherMapProps, WeatherMapState> {
  private googleMap: google.maps.Map | null = null;

  constructor(props: GoogleWeatherMapProps) {
    super(props);
   
    this.state = new WeatherMapState([]);
  
  }

  // Called once to get geocoding results.
  public getLatLangFromLocation(locations: string[]) {  
    // TODO: this.
  }

  public parseWeatherDataInfo(googleMap: google.maps.Map) {
    console.log('PARSE WEATHER DATA INFO CALLED!');
    // Set up markers on google maps.
    const geocoder: GeoCodingService = new GeoCodingService();
    // const locationsToProcess: LocationMarkerInformation[] = [];
    // this.state.locationInfo = [];
    // Reset location info.
    this.state.setLocationInfo([]);
    const geocodePromises: Array<Promise<any>> = [];
    
    for (const location of this.props.weatherDataMap.keys()) {
      console.log(location);    
      // A promise is returned by geocodeAddress().
      const geocodePromise: Promise<void> = geocoder.geocodeAddress(location + ', Melbourne, Australia')
        .then((results: google.maps.GeocoderResult[]) => {
          // console.log('Geocoder finished');
          const jsonResult: google.maps.GeocoderResult = results[0];
          // Parse out info we need.
          const formattedAddress: string = jsonResult.formatted_address;
          const latLongString: string = JSON.stringify(jsonResult['geometry']['location']);
          const latLongJson: JSON = JSON.parse(latLongString);
          const latitude: number = latLongJson['lat'];
          const longitude: number = latLongJson['lng'];
          // console.log('WeatherDataMap Below');
          // console.log(this.props.weatherDataMap);
          // console.log('location: ' + location);
          // console.log(this.props.weatherDataMap.get(location));
          const monitoredLocationInfo: MonitoredLocationInformation | undefined = 
            this.props.weatherDataMap.get(location);

          let rainfall: number|null;
          let temp: number|null;

          if (monitoredLocationInfo !== undefined) {
            const weatherData: WeatherLocationData = monitoredLocationInfo.weatherDataList[
              monitoredLocationInfo.weatherDataList.length - 1];
            if ((weatherData.rainfallData !== undefined) && 
              (weatherData.rainfallData !== null)) {
              rainfall = Number(weatherData.rainfallData.rainfall);
            } else {
              rainfall = null;
            }

            if ((weatherData.temperatureData !== undefined) && 
              (weatherData.temperatureData !== null)) {
              temp = Number(weatherData.temperatureData.temperature);
            } else {
              temp = null;
            }
          } else {
            temp = null;
            rainfall = null;
          }
          
          // Make new object of type LocationMarkerInfo.
          const locationInfo: LocationMarkerInformation = {
            latitude,
            longitude,
            formattedAddress,
            temp,
            rainfall
          };         
          this.state.locationInfo.push(locationInfo);
          // locationsToProcess.push(locationInfo);
        })
        .catch((error) => {
          console.log(error);
        });
      // Collect promises.
      geocodePromises.push(geocodePromise);
    }
    // Wait for all geocode promises to finish.
    Promise.all(geocodePromises)
      .then((response) => {
        console.log('INSIDE PROMISE ALL RESPONSES');
        // Note: google map typings in node_modles/@types/googlemaps. Not sure why vs code red underlines
        // google sometimes but Marker is still resolved.
        // const locationPins: google.maps.Marker[] = [];
        // const locationHeatMap: google.maps.Circle[] = [];
        // // // Place markers for all locations.
        this.state.clearCircles();
        this.state.clearPins();
        for (const locInfo of this.state.locationInfo) {
          
          // Only handle temp for now.
          if (locInfo.temp == null) {
            continue;
          }

          // TODO: This is buggy, need to place Map instance in map.
          const latlang = new google.maps.LatLng(locInfo.latitude, locInfo.longitude);
          const pin = new google.maps.Marker({
            position: latlang,
            map: googleMap,
            title: locInfo.formattedAddress
          });
          this.state.locationPins.push(pin);
        
          // 42 is max temp in melbourne in 2016, opacity = location temp / 42 rounded to 2 decimal places.
          const opacity: number = Math.round((locInfo.temp / 42) * 100 ) / 100;
          
          const heatCircle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: '#FF0000',
            fillOpacity: opacity,
            map: googleMap,
            center: latlang,
            radius: 10000
          });
          this.state.locationHeatMap.push(heatCircle);
        }
     
      })  
      .catch((error) => {
        console.log(error);
      });
  }

  // TODO: Remove markers, http://stackoverflow.com/questions/1544739/google-maps-api-v3-how-to-remove-all-markers
  public componentDidMount() {
    // Make a new google map
    console.log('-- component did mount ---');
    const googleMap = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -37.81950134905335, lng: 144.98429111204815},
        zoom: 8
    });
    this.googleMap = googleMap;

    // const infowindow = new google.maps.InfoWindow({
    //     position: {lat: -37.81950134905335, lng: 144.98429111204815},
    //     content: 'intro',
    // });
    // console.log('infowindow');
    // console.log(infowindow);
    // console.log('CompontentDidMount');
    // pin.addListener('mouseover', () => {
    //   console.log('mouse over');
    //   infowindow.open(googleMap);      
    // });
    
    // pin.addListener('mouseout', () => {
    //   infowindow.close();
    // });
    // console.log(pin);
  }
  
  public render(): JSX.Element {   

    console.log('-- RENDER() called --');

    if (this.googleMap !== null) {
    
      this.parseWeatherDataInfo(this.googleMap);
    }
    
    return (
      <div id="map">
        Test map above.
      </div>
    );
  }
  
}

export default GoogleWeatherMap;
export {GoogleWeatherMap, LocationMarkerInformation};
