/*
Auth: Nate Koike and Anthony Reyes
Date: May 28th
Desc: Took out all the callback functionality and made it condensed
Note: this is currently just a terminal application, but i might build an HTML
      interface later
      to run this program use the following
      "node weather [weatherKey] [geocodeKey] [city] [MM/DD]"
*/
var async = require("async")
var request = require("request-promise");
// the base url that we will modify for weather requests
const WEATHER = "https://api.darksky.net/forecast/";
// the base url that we will modify for location requests
const LATLNG = "http://www.mapquestapi.com/geocoding/v1/address?key=";
async function makePrediction(data) {
  // the average high temperature
  let d = [0, 0, 0];
  // sum all of the daily highs, lows, and precipitation chance
  async.forEach(
    [[0, "temperatureHigh"], [1, "temperatureLow"],
    [2, "precipProbability"]], (x) => {
      for (i in data) { d[x[0]] += data[i][x[1]] };
      d[x[0]] = d[x[0]] / data.length;
      let roc = (parseFloat(data[data.length - 1][x[1]]) -
        parseFloat(data[0][x[1]])) / data.length;
      d[x[0]] = x[1] === 'precipProbability' ? Math.round(100 * (d[x[0]] + roc))
        : Math.round(d[x[0]] + roc);
    })
  console.log("          The daily high should be around", d[0], "degrees");
  console.log("           The daily low should be around", d[1], "degrees");
  console.log("The precipitation chance should be around", d[2] + "%");
}
// get data from Dark Sky on the given date
async function getWeather(URL, dateString, year) {
  // if the iterator is 6, sto psince we have our 5 data points
  let data = []
  for (let i = 1; i < 6; i++) {
    // get the date for which we need data
    let fetchDate = year - i + dateString;
    // add the date to the url
    let fetchURL = URL + fetchDate;
    stats = (await request({ url: fetchURL, json: true })).daily.data[0]
    data.push(stats);
  }
  return data;
}
// make a prediction about future weather based on past data
function getData(key, date, coords) {
  // add the key to the url to prepare for data requests
  const getDate = (date) => {
    // get the base format for the corrected date, 1 second into the day
    var correct = "T00:00:01";
    // split the date into a usable format
    var splitDate = date.split("/");
    // add add the values so it reads -[MM]-[DD]correct
    for (let i = splitDate.length - 1; i >= 0; i--) {
      // add a leading zero to the term if necessary
      correct =
        splitDate[i].length < 2 ? "0" + splitDate[i] + correct
          : splitDate[i] + correct;
      // add the delimiter
      correct = "-" + correct;
    }
    return correct;
  }
  var URL = WEATHER + key + "/" + coords.lat + "," + coords.lng + ",";
  // first, make the date into the correct format
  var dateString = getDate(date);
  // get the current year
  var currentYear = new Date().getFullYear();
  // make an array to accep the data
  return [URL, dateString, currentYear]
};
// get the latitude and longitude of a city using the MapQuest API
async function getCoords(city, key) {
  const URL = LATLNG + key +
    '&inFormat=json&outFormat=json&json={"location":{"street":"' + city +
    '"},"options":{"thumbMaps":false,"maxResults":"1"}}';
  var coords = (await request({ url: URL, json: true }))
    .results[0].locations[0].displayLatLng; return coords
}
async function main() {
  // get the args comamnd line call to the program
  var args = {
    getCoords: [process.argv[4], process.argv[3]],
    getData: [process.argv[2], process.argv[5]]
  }
  // get the coordinates of the city as a JSON object with lat and lng
  const coords = await getCoords(...args.getCoords)
  // make a prediction
  let data = getData(...args.getData, coords);
  data = await getWeather(...data); makePrediction(data);
}
main();
