/*
    This script takes the ticker and date information, and converts and combines it so that a 
    download of the Yahoo Finance data as a CSV can be initiated.
*/

/*
    ~~~~~
    TODO
    ~~~~~
    [*] Checkbox to add/remove dividends and stock splits from data
*/

import {YahooFinanceAPI} from "./YahooFinanceAPI.js";

/////
// CONSTANTS
/////
// Place constants here


// Declare variables to attach HTML elements
const ticker = document.querySelector("#ticker");
const dateRangeChoice1 = document.querySelector("#dateRangeChoice1");
const dateRangeChoice2 = document.querySelector("#dateRangeChoice2");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const timeResolutionChoice1 = document.querySelector("#timeResolutionChoice1");
const timeResolutionChoice2 = document.querySelector("#timeResolutionChoice2");
const timeResolutionChoice3 = document.querySelector("#timeResolutionChoice3");
const btnSubmit = document.querySelector("#btnSubmit");
const btnReset = document.querySelector("#btnReset");

// Enable/disable date range 
dateRangeChoice2.addEventListener("click", enableDateInputs);
dateRangeChoice1.addEventListener("click", disableDateInputs);

// Submit and open a new tab
btnSubmit.addEventListener("click", downloadCSV);

// Reset the fields back to default
btnReset.addEventListener("click", resetPage);


/////
// FUNCTION DECLARATIONS
/////

/*
    Enables the startDate and endDate <input type="date"> elements.
*/
function enableDateInputs()
{
    startDate.disabled = false;
    endDate.disabled = false;
}

/*
    Disables the startDate and endDate <input type="date"> elements.

*/
function disableDateInputs()
{
    startDate.disabled = true;
    endDate.disabled = true;
    startDate.value = "";
    endDate.value = "";
}

/*
    Resets all input elements to blank and all checked boxes backed to original state defined in 
    yfindler.html.
*/
function resetPage()
{
    ticker.value = "";

    dateRangeChoice1.checked = true;
    // Might as well use disableDateInputs() since it resets to desired initial state
    disableDateInputs();

    timeResolutionChoice1.checked = true;
}

/*
    Asynchronously uses the information entered to create a query and return the desired data as 
    a CSV.
*/
async function downloadCSV()
{
    // Get the time interval
    let interval;
    // Daily
    if (timeResolutionChoice1.checked)
        interval = "1d";
    
    // Weekly
    else if (timeResolutionChoice2.checked)
        interval = "1wk";

    // Monthly
    else if (timeResolutionChoice3.checked)
        interval = "1mo";

    // Check if we are doing All data or a desired range
    let yahoo;
    if (startDate.value === "")
        yahoo = new YahooFinanceAPI(ticker.value, interval);
    else
        yahoo = new YahooFinanceAPI(ticker.value, interval, startDate.value, endDate.value);
    

    const raw = await yahoo.retrieveJson();

    // Convert data to its CSV form
    const str = yahoo.compileData(raw).join("\n");

    // Derived from: 
    // https://www.youtube.com/watch?v=eicLNabvZN8
    const blob = new Blob([str], {type: "text/html"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", ticker.value + ".csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}