import * as SocketIo from 'socket.io';
import * as chalk from 'chalk';

import { OnLocationsRetrievedListener } from '../interface/OnLocationsRetrievedListener';
import { OnWeatherRetrievedListener } from '../interface/OnWeatherRetrievedListener';
import { SoapClientBuilder } from '../soap_weather_client/SoapClientBuilder';
import { WeatherLocationData } from '../model/WeatherLocationData';
let melbourneWeatherLocations: string[] = [];
// Setup web sockets.
// Listen to port 8080, frontend connects to port 8080.
const io: SocketIO.Server = SocketIo.listen(8080); 
io.sockets.on('connection', (socket: SocketIO.Server): void => {  
  // Session started with frontend.
  console.log(chalk.cyan('Session started'));
  socket.emit('locations', melbourneWeatherLocations);
});

// Make SOAP Client.
new SoapClientBuilder().build()
.then((melbourneWeatherClient): void => {

  // When SOAP Client is resolved which returns melbourneWeatherClient from an async call.
  melbourneWeatherClient.addOnWeatherRetrievedListener(

    new class implements OnWeatherRetrievedListener {
      /**
       * Anonymous class implements onWeatherRetrieved() method in OnWeatherRetrievedListener.
       * Logs timestamp and weatherLocationDataList in backend before sending data to frontend.
       * @param weatherLocationDataList List of WeatherLocationData to be sent to frontend.
       */
      public onWeatherRetrieved(weatherLocationDataList: WeatherLocationData[]): void {
        // Send updated data to front end.
        const timeStamp: string = new Date().toString();
        console.log(chalk.cyan('Emit weather location data at time: ' + timeStamp));
        io.sockets.emit('weather_data', weatherLocationDataList);
      }
    }()
  );

  melbourneWeatherClient.addOnLocationsRetrievedListener(
    new class implements OnLocationsRetrievedListener {

      /**
       * Anonymous class implements onLocationsRetrieved() method in OnLocationsRetrievedListener.
       * Retrieves all locations from SOAP client points.
       * Only called once, under the assumption locations are set.
       * @param locations List of strings of locations.
       */
      public onLocationsRetrieved(locations: string[]): void {
        melbourneWeatherLocations = locations;
        io.sockets.emit('locations', locations);
        console.log(chalk.cyan('locations :' + locations));
        const msInterval = 30000;
        // setInterval() is a JavaScript method that runs the method every msInterval milliseconds.
        // 300000 milliseconds = 5 mins.
        // TODO: Fix so data populated once a session is connected, cache it.
        // TODO: Change 5000 to 5 mins in milliseconds.
        // Note: setInterval() doesn't get data at time 0.
        melbourneWeatherClient.retrieveWeatherData(locations);
        setInterval((): void => { melbourneWeatherClient.retrieveWeatherData(locations); }, msInterval);
      }
    }()
  );
  melbourneWeatherClient.retrieveLocations();
})
.catch((error) => {
  console.error(chalk.bgRed('Error: SOAP client connection'));
  console.error(chalk.red(error.message));
  console.error(chalk.red(error.stack));
});
