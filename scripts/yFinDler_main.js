/*
    This script takes the ticker and date information, and converts and combines it so that a 
    download of the Yahoo Finance data as a CSV can be initiated.
*/

/*
    ~~~~~
    TODO
    ~~~~~
    [*] Add bulk downloader
*/

import {YahooFinanceAPI} from "./YahooFinanceAPI.js";
import { Zip } from "/scripts/zip.js";

/////
// CONSTANTS
/////
// Place constants here


// Declare variables to attach HTML elements

// Mode toggle
const downloadType1 = document.querySelector("#downloadType1");
const downloadType2 = document.querySelector("#downloadType2");

// Form 1
const form1Single = document.querySelector("#form1Single");
const ticker = document.querySelector("#ticker");

// Form 2
const form2Multi = document.querySelector("#form2Multi");
const tickers = document.querySelector("#tickers");

// General
const dateRangeChoice1 = document.querySelector("#dateRangeChoice1");
const dateRangeChoice2 = document.querySelector("#dateRangeChoice2");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const dividendsCheckbox = document.querySelector("#dividendsCheckbox");
const stockSplitsCheckbox = document.querySelector("#stockSplitsCheckbox");
const timeResolutionChoice1 = document.querySelector("#timeResolutionChoice1");
const timeResolutionChoice2 = document.querySelector("#timeResolutionChoice2");
const timeResolutionChoice3 = document.querySelector("#timeResolutionChoice3");
const btnSubmit = document.querySelector("#btnSubmit");
const btnReset = document.querySelector("#btnReset");

// Progress
const progress = document.querySelector("#progress");

// Error
const failedList = document.querySelector("#failedList");

// Toggle form view based on which radio option is selected
downloadType1.addEventListener("click", toggleForm);
downloadType2.addEventListener("click", toggleForm);

// Enable/disable date range 
dateRangeChoice2.addEventListener("click", enableDateInputs);
dateRangeChoice1.addEventListener("click", disableDateInputs);

// Submit and open a new tab
btnSubmit.addEventListener("click", downloadFiles);

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
    // Reset both version of ticker inputs
    ticker.value = "";
    tickers.value = "";

    dateRangeChoice1.checked = true;
    // Might as well use disableDateInputs() since it resets to desired initial state
    disableDateInputs();

    dividendsCheckbox.checked = true;
    stockSplitsCheckbox.checked = true;

    timeResolutionChoice1.checked = true;

    // Reset Single vs Multi to Single
    downloadType1.checked = true;
    form1Single.hidden = false;
    form2Multi.hidden = true;

    // Reset progress
    progress.innerText = "Progress: 0/0";

    // Reset failed list
    failedList.innerText = "";
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
    if (startDate.value === "" || endDate.value === "")
        yahoo = new YahooFinanceAPI(ticker.value, interval, 
                                    dividendsCheckbox.checked, stockSplitsCheckbox.checked);
    else
        yahoo = new YahooFinanceAPI(ticker.value, interval, 
                                    dividendsCheckbox.checked, stockSplitsCheckbox.checked, 
                                    startDate.value, endDate.value);
    
    
    progress.innerText = "Progress: 0/1";
    try
    {
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
    catch (error)
    {
        failedList.innerText = ticker + "\n" + failedList.innerText;
    }

    progress.innerText = "Progress: 1/1";    
}

/*
    Asynchronously uses the information entered to create multiple queries 
    and return the desired data as a zip file of CSVs.
*/
async function downloadCSVsAsZip()
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

    // Grab the list of tickers
    // Standardize whitespace to a single kind for splitting
    const tickersList = tickers.value.replaceAll("\n", " ");
    const tickersArray = tickersList.split(" ");

    // Update progress bar
    let count = 0;
    progress.innerText = ("Progress: " 
        + String(count) 
        + "/" 
        + String(tickersArray.length));
    
    // Create zip file
    const zipFile = new Zip("stock_data_zip");

    for (const ticker of tickersArray)
    {
        // Check if we are doing All data or a desired range
        let yahoo;
        if (startDate.value === "" || endDate.value === "")
            yahoo = new YahooFinanceAPI(ticker, interval, 
                                        dividendsCheckbox.checked, stockSplitsCheckbox.checked);
        else
            yahoo = new YahooFinanceAPI(ticker, interval, 
                                        dividendsCheckbox.checked, stockSplitsCheckbox.checked, 
                                        startDate.value, endDate.value);
        
        
        try
        {
            const raw = await yahoo.retrieveJson();

            // Convert data to its CSV form
            const str = yahoo.compileData(raw).join("\n");

            // Add to ZIP FILE
            zipFile.str2zip(ticker + ".csv", str);
        }
        catch (error)
        {
            failedList.innerText = ticker + "\n" + failedList.innerText;
        }
        
        // Update progress bar
        count += 1;
        progress.innerText = ("Progress: " 
        + String(count) 
        + "/" 
        + String(tickersArray.length));
    }
    // Download zip file
    zipFile.makeZip();
}

/*
    Choose proper download choice between single and mulitple.
*/
async function downloadFiles()
{
    // Make sure progress and fail list are reset before we start
    progress.innerText = "Progress: 0/0";
    failedList.innerText = "";

    if (downloadType1.checked)
        await downloadCSV();
    else if (downloadType2.checked)
        await downloadCSVsAsZip();
}   


/*
    Shows/hides forms based on which <input> radio is selected.

    @param event event sent by eventListener
*/
function toggleForm(event)
{
    switch(event.currentTarget.id)
    {
        case downloadType1.id:
            form1Single.hidden = false;
            form2Multi.hidden = true;
            break;
        case downloadType2.id:
            form1Single.hidden = true;
            form2Multi.hidden = false;
            break;
        default:
            console.log("ERROR: toggleForm switch statement recieved an unexpected value.")
    }
}