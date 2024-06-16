/*
    Converts premium to days to show an alternative view of profit/loss. The final result is 
    outputted as a simple sentence so that the results can be interpretted quickly.

    *** NOTES ***
        The event listener has multiple aspects to think about. You add an event listener to an 
        HTML element, typically through the "addEventListener" method. The "addEventListener" 
        method has up to three parameters: 
        addEventListener(type, listener, options) or
        addEventListener(type, listener, useCapture)

        type = what type of event to listen for such as a key press, mouse click/movement, etc.
        listener = object that gets activated when event happens, either an object with a 
            handleEvent() method or a function
        options = a bunch of flags to turn on to customize eventListener's actions
        useCapture = if true use "capture" mode (which is a trickle down) or if false/default 
            use bubble up mode

        A quick explanation about bubble up vs capture/trickle down:

        Bubble up:
        If you have event listeners on a parent element and a child element, and you do an event 
        on the child element that could technically trigger the parent element's event listener too, 
        then it will activate the child's first, then the parents.

        Capture/Trickle down:
        If you have event listeners on a parent element and a child element, and you do an event 
        that could technically trigger both, it will activate the parent element first then the 
        child element. In other words it works in reverse order of bubble up.

        You can use a method, "stopPropagation" which prevents propagation for both bubble up 
        and capture/trickle down.

        EVENTS: TARGET VS CURRENTTARGET
        When "addEventListener" activates the listener in its parameters, it sends an event to the 
        listener. Thus a listener object/function could have the ability to take a parameter of its 
        own: the event. Events have multiple attributes but two important ones are:
        Event.target and Event.currentTarget

        target = an event property that refers to the element that the event actually happened on
        currentTarget = an event property that refers to the element that the event listener is 
            current attached to. For example:
            someElement.addEventListener(...), if you were using the currentTarget property to the 
            for the event passed to the listener of this statement, it would refer to someElement.

        Remember, the reason why target is even possible is that elements can propagate the event 
        up or down (bubble up or capture/trickle down) which means even if the target does not have 
        an eventListener, its children/ancestors might. Thus these two attributes help give the 
        ability to target the event based on if we want the listener of the event (currentTarget) 
        or where the event actually occurred (target).
    ~~~~~

*/

// Declare variables to attach HTML elements

// Mode toggle
const timeFormChoice1 = document.querySelector("#timeFormChoice1");
const timeFormChoice2 = document.querySelector("#timeFormChoice2");

// Form 1 - DTE/Days
const form1Days = document.querySelector("#form1Days");
const startDTE = document.querySelector("#startDTE");
const startDTEFeedback = document.querySelector("#startDTEFeedback");
const startExPrem = document.querySelector("#startExPrem");
const startExPremFeedback = document.querySelector("#startExPremFeedback");
const currentDTE = document.querySelector("#currentDTE"); 
const currentDTEFeedback = document.querySelector("#currentDTEFeedback");
const currentExPrem = document.querySelector("#currentExPrem");
const currentExPremFeedback = document.querySelector("#currentExPremFeedback");

// Form 2 - Dates
const form2Dates = document.querySelector("#form2Dates");
const expirDate = document.querySelector("#expirDate");
const expirDateFeedback = document.querySelector("#expirDateFeedback");
const startDate = document.querySelector("#startDate");
const startDateFeedback = document.querySelector("#startDateFeedback");
const startExPrem2 = document.querySelector("#startExPrem2");
const startExPrem2Feedback = document.querySelector("#startExPrem2Feedback");
const currentDate = document.querySelector("#currentDate");
const currentDateFeedback = document.querySelector("#currentDateFeedback");
const currentExPrem2 = document.querySelector("#currentExPrem2");
const currentExPrem2Feedback = document.querySelector("#currentExPrem2Feedback");

// General
const btnSubmit = document.querySelector("#btnSubmit");
const btnReset = document.querySelector("#btnReset");
const calcSentence = document.querySelector("#calcSentence");


// Declare the four flags for form 1
let isStartDTEValid = false;
let isStartExPremValid = false;
let isCurrentDTEValid = false;
let isCurrentExPremValid = false;

// Declare the five flags for form 2
let isExpirDateValid = false;
let isStartDateValid = false;
let isStartExPrem2Valid = false;
let isCurrentDateValid = false;
let isCurrentExPrem2Valid = false;

// Toggle form view based on which radio option is selected
timeFormChoice1.addEventListener("click", toggleForm);
timeFormChoice2.addEventListener("click", toggleForm);

// Form 1 - Validate all data entries
startDTE.addEventListener("input", dteValidator);
startExPrem.addEventListener("input", priceValidator);
currentDTE.addEventListener("input", dteValidator);
currentExPrem.addEventListener("input", priceValidator);

/*
    Form 2 - Validate all data entries
    For now we will not check the two <input type="date"> elements because the elements are 
    supportedd on all major browsers.
    Only check if <input type="date"> is not empty since all major browsers support this input type.
    Thus it is validated by design of the form.
*/
expirDate.addEventListener("input", dateValidator);
expirDate.addEventListener("click", dateValidator);
startDate.addEventListener("input", dateValidator);
startDate.addEventListener("click", dateValidator);
startExPrem2.addEventListener("input", priceValidator);
currentDate.addEventListener("input", dateValidator);
currentDate.addEventListener("click", dateValidator);
currentExPrem2.addEventListener("input", priceValidator);


// Check if all inputs are valid and toggle submit button accordingly
/*
    I don't know if this violates any practices but I attached the event listener to the main document 
    itself. I figured between the bubbiling up of the fields, even if it isn't maximally efficient, it 
    should not cause any slowdowns.
*/
document.addEventListener("input", toggleSubmitButton);

// If valid, output sentence
btnSubmit.addEventListener("click", generateSentence);

// Reset fields and output
btnReset.addEventListener("click", resetPage);

/////
// FUNCTION DEFINITIONS
/////

/*
    Chooses the sentence to generate explaining the time to premium conversion.
*/
function generateSentence()
{
    if (timeFormChoice1.checked)
        generateForm1Sentence();
    else if (timeFormChoice2.checked)
        generateForm2Sentence();
}

/*
    Generates the sentence for form 1.
*/
function generateForm1Sentence()
{
    const startDTENum = Number(startDTE.value);
    const startExPremNum = Number(startExPrem.value);
    const currentDTENum = Number(currentDTE.value);
    const currentExPremNum = Number(currentExPrem.value);

    const predictedPremium = (startExPremNum / startDTENum ** 0.5) * (currentDTENum ** 0.5);
    const currentPremToDTE = (currentExPremNum * ((startDTENum ** 0.5) / startExPremNum)) ** 2;

    calcSentence.textContent = "The option was sold for $" + startExPremNum + 
    " when it had " + startDTENum + 
    " day(s) to expiration. It currently has " + currentDTENum + 
    " day(s) to expiration. Based on theta, the current price of the option should be $" + predictedPremium.toFixed(2) + 
    ". However the current price of the option is $" + currentExPremNum +
    ", which is the price the option would have if it had " + currentPremToDTE.toFixed(2) + 
    " day(s) to expiration.";
}

/*
    Generates the sentence for form 2.
*/
function generateForm2Sentence()
{
    const startDTENum = findDays(expirDate.value, startDate.value);
    const startExPremNum = Number(startExPrem2.value);
    const currentDTENum = findDays(expirDate.value, currentDate.value);
    const currentExPremNum = Number(currentExPrem2.value);

    const predictedPremium = (startExPremNum / startDTENum ** 0.5) * (currentDTENum ** 0.5);
    const currentPremToDTE = (currentExPremNum * ((startDTENum ** 0.5) / startExPremNum)) ** 2;

    calcSentence.textContent = "The option was sold for $" + startExPremNum + 
    " when it had " + startDTENum + 
    " day(s) to expiration. It currently has " + currentDTENum + 
    " day(s) to expiration. Based on theta, the current price of the option should be $" + predictedPremium.toFixed(2) + 
    ". However the current price of the option is $" + currentExPremNum +
    ", which is the price the option would have if it had " + currentPremToDTE.toFixed(2) + 
    " day(s) to expiration.";
}

/*
    I use the UTC method because supposedly there are hiccups related to DST, so by standardizing 
    to UTC, I can more easily utilize the math to find the number of days.

    Returns the number of days (absolute value) between two dates.

    @param date a string of form "YYYY-MM-DD"
    @return the number of days between the two dates
*/
function findDays(date1, date2)
{
    let dateSplit = date1.split("-");
    const year1 = Number(dateSplit[0]);
    const monthIndex1 = Number(dateSplit[1] - 1);
    const day1 = Number(dateSplit[2]);

    dateSplit = date2.split("-");
    const year2 = Number(dateSplit[0]);
    const monthIndex2 = Number(dateSplit[1] - 1);
    const day2 = Number(dateSplit[2]);

    const dateUTC1 = new Date(Date.UTC(year1, monthIndex1, day1));
    const dateUTC2 = new Date(Date.UTC(year2, monthIndex2, day2));

    const msPerDay = 1000 * 60 * 60 * 24;

    return Math.abs(Math.floor((dateUTC1 - dateUTC2) / msPerDay));   
}

/*
    Toggles the Submit button based on if all inputs are valid depending on the <input> radio selected.
*/
function toggleSubmitButton()
{
    if (timeFormChoice1.checked)
        // Since we toggle to disable the button, we need to invert the result of checking the flags
        btnSubmit.disabled = !(isStartDTEValid && isStartExPremValid & isCurrentDTEValid && isCurrentExPremValid);
    else if(timeFormChoice2.checked)
        btnSubmit.disabled = !(isExpirDateValid && isStartDateValid && isStartExPrem2Valid && isCurrentDateValid && isCurrentExPrem2Valid);
}

/*
    Resets all input text and dates, feedback paragraphs, sentence paragraph, and submit button back 
    to original values.
*/
function resetPage()
{
    // Set mode back to DTE
    timeFormChoice1.checked = true;

    // Show form 1 and hide form 2
    form1Days.hidden = false;
    form2Dates.hidden = true;

    // Reset all .inputText <input> (both type text and date as inputText)
    const resetInputs = document.querySelectorAll(".inputText");
    for (const input of resetInputs)
        input.value = "";
        

    // Reset all .feedback <p>
    const resetFeedbacks = document.querySelectorAll("p.feedback");
    for (const feedback of resetFeedbacks)
        feedback.textContent = "--";
        

    // Reset sentence output
    calcSentence.textContent = "--";

    // Reset Submit button
    btnSubmit.disabled = true; 
}

/*
    Modifies extrinsic premium feedback elements based on which premium field was entered.

    @param event event sent by eventListener
*/
function priceValidator(event)
{
    // Use currentTarget to get the element ID so we can get the element
    const element = document.querySelector("#" + event.currentTarget.id);

    // Feedback messages defined
    const correct = "Valid extrinsic premium amount!";
    const incorrect = "Error: Enter decimal number greater than or equal to 0."

    /*
        Choose between the four possible fields
        Save flag that corresponds to correct field
        Give feedback on if valid for premium forms
        Can check value simply by casting to Number and making sure it is >= 0
        JavaScript truthy/falsy mechanism will catch NaN automatically
        We need to catch the empty string case too hence element.value
        To convert explicitly to a boolean use the double NOT (!!)
    */
    
    switch (element)
    {
        // Form 1
        case startExPrem:
            isStartExPremValid = !!(Number(element.value) >= 0 && element.value);
            startExPremFeedback.textContent = isStartExPremValid ? correct : incorrect;
            break;
        case currentExPrem:
            isCurrentExPremValid = !!(Number(element.value) >= 0 && element.value);
            currentExPremFeedback.textContent = isCurrentExPremValid ? correct : incorrect;
            break;
        
        // Form 2
        case startExPrem2:
            isStartExPrem2Valid =  !!(Number(element.value) >= 0 && element.value);
            startExPrem2Feedback.textContent = isStartExPrem2Valid ? correct : incorrect;
            break;
        case currentExPrem2:
            isCurrentExPrem2Valid = !!(Number(element.value) >= 0 && element.value);
            currentExPrem2Feedback.textContent = isCurrentExPrem2Valid ? correct : incorrect;
            break;
        default:
            console.log("ERROR: priceValidator switch statement recieved an unexpected value.");
    }
}

/*
    Modifies DTE feedback elements based on which DTE field was entered.

    @param event event sent by eventListener
*/
function dteValidator(event)
{
    // Use currentTarget to get the element ID so we can get the element
    const element = document.querySelector("#" + event.currentTarget.id);

    // Check for positive integer numbers using regex
    const regex = new RegExp("^[0-9]+$");

    // Feedback messages defined
    const correct = "Valid DTE!";
    const incorrect = "Error: Enter integer greater than or equal to 0.";

    // Choose between the two possible fields
    // Save flag that corresponds to correct field
    // Give feedback on if valid for DTE forms
    switch (element)
    {
        case startDTE:
            isStartDTEValid = regex.test(element.value);
            startDTEFeedback.textContent = isStartDTEValid ? correct : incorrect;
            break;
        case currentDTE:
            isCurrentDTEValid = regex.test(element.value);
            currentDTEFeedback.textContent = isCurrentDTEValid ? correct : incorrect;
            break;
        default:
            console.log("ERROR: dteValidator switch statement recieved an unexpected value.");
    }
}

/*
    Modifies d feedback elements based on which DTE field was entered.

    @param event event sent by eventListener
*/
function dateValidator(event)
{
    const correct = "Valid date!";
    const incorrect = "Error: Complete the date input.";
    /*
        We can utilize truthy/falsy of JavaScript.
        According to my test, the value field is only set if the field is FULLY filled, otherwise 
        it is set as blank.
    */
    switch(event.currentTarget.id)
    {
        case expirDate.id:
            isExpirDateValid = !!event.currentTarget.value;
            expirDateFeedback.textContent = isExpirDateValid ? correct : incorrect;
            break;
        case startDate.id:
            isStartDateValid = !!event.currentTarget.value;
            startDateFeedback.textContent = isStartDateValid ? correct : incorrect;
            break;
        case currentDate.id:
            isCurrentDateValid = !!event.currentTarget.value;
            currentDateFeedback.textContent = isCurrentDateValid ? correct : incorrect;
            break;
        default:
            console.log("ERROR: dateValidator switch statement recieved an unexpected value.");
    }
}

/*
    Shows/hides forms based on which <input> radio is selected.

    @param event event sent by eventListener
*/
function toggleForm(event)
{
    switch(event.currentTarget.id)
    {
        case timeFormChoice1.id:
            form1Days.hidden = false;
            form2Dates.hidden = true;
            break;
        case timeFormChoice2.id:
            form1Days.hidden = true;
            form2Dates.hidden = false;
            break;
        default:
            console.log("ERROR: toggleForm switch statement recieved an unexpected value.")
    }
}