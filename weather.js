/*
Auth: Nate Koike
Date: 25 November 2019
Desc: predict future weather patterns in a city based on past data. this is
      similar to a Farmer's Almanac, but for (almost) anywhere in the world

Note: this is currently just a terminal application, but i might build an HTML
      interface later

      to run this program use the following
      "node weather [weatherKey] [geocodeKey] [city] [MM/DD]"
*/

const request = require("request");

// the base url that we will modify for weather requests
const WEATHER = "https://api.darksky.net/forecast/";

// the base url that we will modify for location requests
const LATLNG = "http://www.mapquestapi.com/geocoding/v1/address?key=";

var weatherKey; // this will be the key to access the weather api
var geocodeKey; // this will be the key to access the geocoding api

// convert the date into the stem of the correct format
// return [MM]-[DD]T00:00:00
function getDate(date) {
  // get the base format for the corrected date, 1 second into the day
  var correct = "T00:00:01";

  // split the date into a usable format
  var splitDate = date.split("/");

  // add add the values so it reads -[MM]-[DD]correct
  for (let i = splitDate.length - 1; i >= 0; i--) {
    // add a leading zero to the term if necessary
    correct =
      splitDate[i].length < 2
        ? "0" + splitDate[i] + correct
        : splitDate[i] + correct;

    // add the delimiter
    correct = "-" + correct;
  }

  return correct;
}

function makePrediction(data) {
  // the average high temperature
  var high = 0;

  // the average low temperature
  var low = 0;

  // the average precipitation chance
  var precip = 0;

  // sum all of the daily highs, lows, and precipitation chance
  for (let i = 0; i < data.length; i++) {
    // console.log("high:", parseFloat(data[i].temperatureHigh)); // debugging code
    // console.log("low:", parseFloat(data[i].temperatureLow)); // debugging code
    // console.log("low:", parseFloat(data[i].precipProbability)); // debugging code

    high += parseFloat(data[i].temperatureHigh);
    low += parseFloat(data[i].temperatureLow);
    precip += parseFloat(data[i].precipProbability);
  }

  // divide for the averages and round for neatness
  high = high / data.length;
  low = low / data.length;
  precip = precip / data.length;

  // get the general rate of change for each prediction
  let rocHigh =
    (parseFloat(data[data.length - 1].temperatureHigh) -
      parseFloat(data[0].temperatureHigh)) /
    data.length;
  let rocLow =
    (parseFloat(data[data.length - 1].temperatureLow) -
      parseFloat(data[0].temperatureLow)) /
    data.length;
  let rocPrecip =
    (parseFloat(data[data.length - 1].precipProbability) -
      parseFloat(data[0].precipProbability)) /
    data.length;

  // add the rates of change to the predictions
  high = Math.round(high + rocHigh);
  low = Math.round(low + rocLow);
  precip = Math.round((precip + rocPrecip) * 100);

  // output the data
  console.log();
  console.log("          The daily high should be around", high, "degrees");
  console.log("           The daily low should be around", low, "degrees");
  console.log("The precipitation chance should be around", precip + "%");
}

// get data from Dark Sky on the given date
function getWeather(weatherURL, dateString, year, iterator, data, callback) {
  // if the iterator is 6, sto psince we have our 5 data points
  if (iterator > 5) {
    makePrediction(data);
    return; // exit this function and the program
  }

  // get the date for which we need data
  let fetchDate = year - iterator + dateString;

  // add the date to the url
  let fetchURL = weatherURL + fetchDate;

  request({ url: fetchURL, json: true }, function(err, res) {
    stats = res.body.daily.data[0];
    data.push(stats);
    // console.log(weatherURL); // this is for debugging purposes

    callback(weatherURL, dateString, year, iterator + 1, data, callback);
  });
}

// make a prediction about future weather based on past data
function getData(key, date, coords) {
  // add the key to the url to prepare for data requests
  var URL = WEATHER + key + "/" + coords.lat + "," + coords.lng + ",";

  // first, make the date into the correct format
  var dateString = getDate(date);

  // get the current year
  var currentYear = new Date().getFullYear();

  // make an array to accep the data
  var data = [];

  // make the iterator for the recursive for loop
  let iterator = 1;

  // get the weather data
  getWeather(URL, dateString, currentYear, iterator, data, getWeather);
}

// get the latitude and longitude of a city using the MapQuest API
function getCoords(city, key, callback) {
  var URL =
    LATLNG +
    key +
    // take JSON in, return JSON
    '&inFormat=json&outFormat=json&json={"location":{"street":"' +
    city + // add the city name to the query
    // disable the map and limit the number of responses to one
    '"},"options":{"thumbMaps":false,"maxResults":"1"}}';

  request({ url: URL, json: true }, function(err, res) {
    // parse the result to get just the JSON object containing the lat and
    // long coordinates for the city
    var coords = res.body.results[0].locations[0].displayLatLng;
    // console.log(coords, "in function"); // prints coords
    callback(coords); // "return" the coordinates to the next function
  });
}

// use the data to make a prediction

// the main function that will handle all the processing
function main() {
  // get the weather api key from the comamnd line call to the program
  weatherKey = process.argv[2];

  // get the geocoding api key from the comamnd line call to the program
  geocodeKey = process.argv[3];

  // get the name of the city
  const city = process.argv[4];

  // get the date that the user would like from the command line
  const date = process.argv[5];

  var predicted;

  // get the coordinates of the city as a JSON object with lat and lng
  getCoords(city, geocodeKey, function(coords) {
    // console.log(coords, "are the coords in main"); // debugging code

    // make a prediction
    getData(weatherKey, date, coords);
  });
}

main();
