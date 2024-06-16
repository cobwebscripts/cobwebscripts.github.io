/*
    This script will output values for the SP500TR model on model.html. The computation heavy part does not 
    occur until the user submits for the first time, after which all data is cached for quick retrieval.
*/

/*
    @import StockManipulator class that has ability to generate and output stock data needed for model
*/
import {StockManipulator} from "./StockManipulator.js";

// CONSTANTS
const FIRST_YEAR = 1988;
const FIRST_MONTH = 1;

// Declare variables to attach to HTML elements
/*
    You can two ways of accessing elements by Id. You need the "#" if using the more general querySelector
    because apart from ids you could also query other selectors like class (which start with a ".").
    [1] document.querySelector("#id");
    [2] document.getElementById("id");
*/
const dateField = document.querySelector("#dateField");
const btnSubmit = document.querySelector("#btnSubmit");
const btnReset = document.querySelector("#btnReset");
const dateFeedback = document.querySelector("#dateFeedback")
const fvp = document.querySelector("#fvp");
const sd = document.querySelector("#sd");
const fvpPlusSD = document.querySelector("#fvpPlusSD");
const fvpSubSD = document.querySelector("#fvpSubSD");

// Variable to hold StockManipulator object
let stockManip;

// Validate the date entered
dateField.addEventListener("input", dateValidator);

// If valid date, update page displaying chosen calculated data
btnSubmit.addEventListener("click", displayResults);

// Reset button to clear all fields and tables
btnReset.addEventListener("click", resetPage);

////
// FUNCTION DEFINITIONS
////

/*
    Utilizes the StockManipulator class functions to display the desired data points.
*/
function displayResults()
{
    // Calculate the array position by calculating difference from first month and year
    const date = dateField.value.split("/");
    const month = Number(date[0]);
    const year = Number(date[1]);
    const index = (year - FIRST_YEAR) * 12 + (month - FIRST_MONTH);

    let fvpVal;
    let sdVal;

    // Check and see if we have initialized and assigned stockManip
    // If not, also generate the properties associted with it
    if (!stockManip)
    {
        stockManip = new StockManipulator();
        stockManip.generateAll();
    }

    // If the index points to a data point we currently have
    if (index < stockManip.getDataLength())
    {
        fvpVal = stockManip.getCurrentPricePoint(index);
        sdVal = stockManip.getCurrentStandardDeviationPoint(index); 
    }
    // Index requires data projection
    else
    {
        fvpVal = stockManip.getForecastPricePoint(index);
        sdVal = stockManip.getForecastStandardDeviationPoint(index);
    }

    /* 
        toFixed() works on Number prototypes to set decimal to a set amount and then outputs the 
        result as a string
    */
    fvp.textContent = fvpVal.toFixed(2);
    sd.textContent =  sdVal.toFixed(2);
    fvpPlusSD.textContent = (fvpVal + sdVal).toFixed(2);
    fvpSubSD.textContent = (fvpVal - sdVal).toFixed(2);
}

/*
    Resets date input box, date feedback paragraph, submit button, 
    and result table cells back to original values.
*/ 
function resetPage()
{
    const resetCells = document.querySelectorAll(".resultCells td");
    for (const resetCell of resetCells)
    {
        resetCell.textContent = "--";
    }
    dateField.value = "";
    dateFeedback.textContent = "--";
    btnSubmit.disabled = true;
}

/*
    Updates the value of the date feedback paragraph to inform user of valid input before unlocking
    the submit button. Date is valid if:
    [*] Fits regex of MM/Y+ or M/Y+
    [*] Date >= FIRST_MONTH and FIRST_YEAR
*/
function dateValidator()
{
    // Keep button disabled if the input is not valid
    btnSubmit.disabled = true;

    // Create a regex that looks for MM/Y+ or M/Y+ format
    // In other words the year needs to be >= 0
    // Check if input fits this criteria
    const regex = new RegExp("^(0?[1-9]|[1][0-2])\/[0-9]+$");
    if (regex.test(dateField.value))
    {
        const mmYY = dateField.value.split("/");
        const month = Number(mmYY[0]);
        const year = Number(mmYY[1]);
        
        // Check if date is no earlier than FIRST_YEAR and FIRST_MONTH
        const diff = (year - FIRST_YEAR) * 12 + (month - FIRST_MONTH);
        if (diff >= 0)
        {
            dateFeedback.textContent = "Valid date!";
            btnSubmit.disabled = false;
        }
        else
        {
            dateFeedback.textContent = "Error: Earliest date is 01/1988.";
        }
    }
    else
    {
        dateFeedback.textContent = "Error: Incorrect date format.";
    }
}