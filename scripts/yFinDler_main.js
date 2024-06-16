/*
    This script takes the ticker and date information, and converts and combines it so that a 
    download of the Yahoo Finance data in a new window/tab can be initiated.
*/

// CONSTANTS
/*
    The end goal it to convert to epoch time in SECONDS.
    So we skip conversion and make the start a large negative value in epoch time.
    This -9999999999  seconds translates to Feb 10, 1653.
*/
const OLDEST = -9999999999;

/*
    Date.now() returns current number of MILLSECONDS since the epoch.
*/
const NOW = Math.ceil(Date.now() / 1000);

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
btnSubmit.addEventListener("click", openURL);

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
    Using form data, calculates the following parameters:
    [*] Ticker
    [*] Start Period
    [*] End Period
    [*] Time interval
    Using this, a URL is generated that can be used to retrieve Yahoo Finance's data.
*/
function generateURL()
{
    // Get the start and end periods for the URL
    let startPeriod;
    let endPeriod;
    if (dateRangeChoice2.checked)
    {
        startPeriod = htmlDateToEpochSeconds(startDate);
        // End period requires a 1 day (86400 second) adjustment
        endPeriod = htmlDateToEpochSeconds(endDate) + 86400;
    }
    else
    {
        startPeriod = OLDEST;
        endPeriod = NOW;
    }

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

    const url = "https://query1.finance.yahoo.com/v7/finance/download/" + ticker.value + 
        "?period1=" + startPeriod + "&period2=" + endPeriod + "&interval=" + interval +
        "&events=history&includeAdjustedClose=true";

    return url;
}

/*
    Converts value of <input type="date"> into seconds since UNIX epoch. 
*/
function htmlDateToEpochSeconds(date)
{
    // Date value regardless of browser presentation is always YYYY-MM-DD
    const dateArr = date.value.split("-");
    //Months are zero indexed
    const dateObj = new Date(dateArr[0], (dateArr[1] - 1), dateArr[2]);

    // getTime() returns in MILLISECONDS since epoch so need to divide by 1000 for SECONDS
    return Math.ceil(dateObj.getTime() / 1000);
}

/*
    Opens the Yahoo Finanace query created in a new tab to initiate the download.
*/
function openURL()
{
    window.open(generateURL(), "_blank");
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