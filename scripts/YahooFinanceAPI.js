/*
    The YahooFinanceAPI is a class focused on interacting with Yahoo Finance API endpoints.
*/

/*
    ~~~~~
    NOTES
    ~~~~~
    When you make an async method in a class, you don't use the function keyword.
    Sources:
    [1] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
    [2] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions
    ~~~~~
    We need a CORS proxy to access data.
    We can see a running list of possible choices [1].
    Sources:
    [1] https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347
    ~~~~~

    ~~~~~
    TODO
    ~~~~~
    [*] Correct timing in compileData() so it mirrors Yahoo Finance page.
        This is an issue for the 1wk and 1mo resolutions.
    [*] Catch errors from Yahoo Finance and throw them up.
    [*] Refactor for better separation of concerns.
    [*] combineData() has an issue on 1wk and 1mo resolutions.
        Even though they are the same date, they get separated because the milliseconds 
        are different.
    [*] Maybe change compileData() and compiledData to 
        prepareData() and preparedData, respectively.
    [*] Create my own CORS proxy to mitigate data tampering risks.
    ~~~~~
*/

/*
    ~~~~~
    SPECIFICATIONS
    ~~~~~
    A standardized format with the data helps with data movement.
    To parse the data we can use a hashmap.
    Key = Timestamps (Date)
    Value = Array
    The array will hold 6 guaranteed slots in this order:
    [1] Open
    [2] High
    [3] Low
    [4] Close
    [5] Adj Close
    [6] Volume

    Two optional slots can be added in this order:
    [7] Dividends
    [8] Stock splits

    However, because both dividends and stock splits are optional, you could have 
    stock splits in the place of dividends if dividends are not selected.

    To accomplish this, we can have always build the array with the first 6 slots first,
    even if it is all empty.
    Then push dividends (if selected) followed by stock splits (if selected).
*/
class YahooFinanceAPI
{


    // Class Field Declarations
    /*
        @field startDate start date of desired range as a string in YYYY-MM-DD form
        @field endDate end date of desired range as a string in YYYY-MM-DD form
        @ticker ticker that corresponds to Yahoo Finance ticker
        @timeResolution resolution represented as "1d", "1wk", or "1mo"
    */
    startDate;
    endDate;
    ticker;
    timeResolution;
    includeDividends;
    includeStockSplits;

    constructor(ticker, timeResolution, 
        includeDividends, includeStockSplits,
        startDate = null, endDate = null)
    {
        this.ticker = ticker;
        this.timeResolution = timeResolution;
        this.startDate = startDate;
        this.endDate = endDate;
        this.includeDividends = includeDividends;
        this.includeStockSplits = includeStockSplits;
    }

    /*
        Asynchronously fetches and returns JSON from URL.

        @return raw stock data in JSON form
    */
    async retrieveJson()
    {
        const corsHost = "https://cors-proxy-ekk39.ondigitalocean.app/yahoo_finance?stock_url=";
        const corsBypassUrl = corsHost + encodeURIComponent(this.#createUrl());
        const response = await fetch(corsBypassUrl);
        const stockJson = await response.json(); 

        if (stockJson.chart.result != null)
            return stockJson;
        else 
        {
            // Currently Yahoo Finance gives error messages in this 
            // JSON format
            const errorCode = stockJson.chart.error.code;
            const errorDescription = stockJson.chart.error.description;
            throw new Error(`Error: ${errorCode} - ${errorDescription}.`);
        }
    }

    /*
        Combines CORS proxy with URL created with class fields to create target URL.

        @return target url
    */
    #createUrl()
    {
        // I set the range to 1000 years so capture all data
        return "https://query1.finance.yahoo.com/v8/finance/chart/"
            + this.ticker
            + "?range=1000y&interval="
            + this.timeResolution
            + "&includePrePost=true&events=div|split|earn";
    }

    /*
        Convert seconds since epoch to string date YYYY-MM-DD.

        @param timeStamp time since epoch in seconds
        @return date as a string in YYYY-MM-DD form
    */
    #secondsToDate(timestamp)
    {
        // timestamp is in seconds but Date takes milliseconds
        const date = new Date(timestamp * 1000);

        let stringDate;

        stringDate = date.getUTCFullYear() + "-"
            + (date.getUTCMonth() + 1).toString() + "-"
            + date.getUTCDate();

        return stringDate;
    }

    /*
        Parses the timestamp array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of timestamps
    */
    #getTimestamps(stockJson)
    {
        return stockJson.chart.result[0].timestamp;
    }

    /*
        Parses the open array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of stock open prices
    */
    #getOpens(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].open;
    }

    /*
        Parses the high array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of stock high prices
    */
    #getHighs(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].high;
    }

    /*
        Parses the low array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of stock low prices
    */
    #getLows(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].low;
    }

    /*
        Parses the close array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of stock close prices
    */
    #getCloses(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].close;
    }

    /*
        Parses the volume array from the stock JSON.

        @param stockJson JSON of stock data
        @return array of stock volume
    */
    #getVolumes(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].volume;
    }

    /*
        Parses the adjusted close array from the stock JSON.

        @param stockJSON JSON of stock data
        @return array of stock adjusted closed prices
    */
    #getAdjCloses(stockJson)
    {
        return stockJson.chart.result[0].indicators.adjclose[0].adjclose;
    }

    /*
        Creates a Map object with timestamp (in seconds since epoch) as key 
        and an array of stock data as the value.

        @param stockJSON JSON of stock data
        @return Map object of stock data
    */
    #createStandardDataHashMap(stockJson)
    {
        const timestamps = this.#getTimestamps(stockJson);
        const opens = this.#getOpens(stockJson);
        const highs = this.#getHighs(stockJson);
        const lows = this.#getLows(stockJson);
        const closes = this.#getCloses(stockJson);
        const volumes = this.#getVolumes(stockJson);
        const adjCloses = this.#getAdjCloses(stockJson);

        const standardData = new Map();
        
        // Create empty spaces for optional values
        const blank = [];
        if (this.includeDividends)
            blank.push("");
        if (this.includeStockSplits)
            blank.push("");

        for (let i = 0; i < timestamps.length; i++)
            {
                standardData.set(timestamps[i], [opens[i], highs[i], lows[i], closes[i]
                    , adjCloses[i], volumes[i]].concat(blank));
            }

        return standardData;
    }

    /*
        Parses the dividend array from the stock JSON.

        @param stockJSON JSON of stock data
        @return array of stock dividends
    */
    #getDividends(stockJson)
    {
        let dividends;
        const output = [];
        // If not undefined assigned
        if (stockJson.chart.result[0].events !== undefined 
            && stockJson.chart.result[0].events.dividends !== undefined)
            dividends = stockJson.chart.result[0].events.dividends;
        else
            return output;

        for (const div in dividends)
        {
            // Bracket notation has to be used to use variable "div" to access JSON data [1].
            // JSON uses the same dot/bracket notation as JavaScript objects [2].
            // Sources:
            // [1] https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics
            // [2] https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
            const time = stockJson.chart.result[0].events.dividends[div].date;
            const amount = stockJson.chart.result[0].events.dividends[div].amount;

            output.push([time, amount]);
        }

        return output;
    }

    /*
        Parses the splits array from the stock JSON.

        @param stockJSON JSON of stock data
        @return array of stock splits
    */
    #getSplits(stockJson)
    {
        let splits;
        const output = [];

        if (stockJson.chart.result[0].events !== undefined 
            && stockJson.chart.result[0].events.splits !== undefined)
            splits = stockJson.chart.result[0].events.splits;
        else
            return output;

        for (const split in splits)
        {
            const time = stockJson.chart.result[0].events.splits[split].date;
            let splitRatio = stockJson.chart.result[0].events.splits[split].splitRatio;
            
            // Added the single quotes because excel will convert the ratio into a time value
            // It does have an effect of showing the data as '2:1' in Excel
            // In Google Sheets it will show as 2:1', but the cell will have '2:1'
            splitRatio = "\'" + splitRatio + "\'";
            
            output.push([time, splitRatio]);
        }

        return output;
    }

    /*
        Combines the optional data (dividends and stock splits) into the Map object
        that holds the standard stock data.

        @param stockJSON JSON of stock data
        @return Map object updated with optional data
    */
    #combineData(stockJson)
    {
        // Blank template if optional data has no standard data to attach to
        const blankVals = ["", "", "", "", "", ""];

        // Keep track of where to push optional data
        let arrPtr = blankVals.length - 1;

        // If there are optional columns we need to include them 
        if (this.includeDividends)
            blankVals.push("");
        if (this.includeStockSplits)
            blankVals.push("");

        const output = this.#createStandardDataHashMap(stockJson);

        // Helper function to parse through the array of optional data
        // and add it to the main Map of stock data.
        // @param arr array containing the dividends or stock splits
        function addOptionalData(arr)
        {
            for (const element of arr)
            {
                const time = element[0];
                const data = element[1];

                // We need to make a DEEP COPY [1]
                // Source: 
                // [1] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copy_an_array
                const tempArr = output.has(time) ? output.get(time) : 
                                JSON.parse(JSON.stringify(blankVals));
                tempArr[arrPtr] = data;

                // Belongs to outer scope!!!!
                output.set(time, tempArr);
            }
        }

        if (this.includeDividends)
        {
            arrPtr += 1;
            addOptionalData(this.#getDividends(stockJson));
        }

        if (this.includeStockSplits)
        {
            arrPtr += 1;
            addOptionalData(this.#getSplits(stockJson));
        }

        return output;
    }

    /*
        Converts a Map object into an array.

        @param dataHashMap Map object of stock data
        @return array of arrays of stock data with timestamp being the first element 
                of each sub array
    */
    #convertDataHashMapToArray(dataHashMap)
    {
        const output = [];

        for (const keyVal of dataHashMap)
        {
            const time = [keyVal[0]];
            const data = keyVal[1];
            output.push(time.concat(data));
        }

        return output;
    }

    /*
        Compiles all data into a format easily converted to CSV form.

        @param stockJSON JSON of stock data
        @return compiled data with headers
    */
    compileData(stockJson)
    {
        let compiledData = this.#combineData(stockJson);
        compiledData = this.#convertDataHashMapToArray(compiledData);

        // You have to customize sort function to handle complex arrays [1].
        // Source:
        // [1] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
        compiledData.sort((a, b) => a[0] - b[0]);

        for (let i = 0; i < compiledData.length; i++)
        {
            compiledData[i][0] = this.#secondsToDate(compiledData[i][0]);
        }

        // See if start and end defined as not null
        if (this.startDate && this.endDate)
        {
            let ptrStart = 0;
            let ptrEnd = compiledData.length - 1;
            const startDateDate = new Date(this.startDate);
            const endDateDate = new Date(this.endDate);
            for (let i = 0; i < compiledData.length - 1; i++)
            {
                const testDate = new Date(compiledData[i][0]);
                if (testDate >= startDateDate && ptrStart === 0)
                    ptrStart = i;

                if (testDate >= endDateDate && ptrEnd === compiledData.length - 1)
                    ptrEnd = i;
            }

            compiledData = compiledData.slice(ptrStart, ptrEnd + 1);
        }       
        
        this.#addHeaders(compiledData);
        return compiledData;
    }

    /*
        Adds headers to the data.

        @param data CSV ready data without headers
        @return CSV ready data with headers
    */
    #addHeaders(data)
    {
        const headers = [
            "Date",
            "Open",
            "High",
            "Low",
            "Close",
            "Adj Close",
            "Volume"
        ];

        if (this.includeDividends)
            headers.push("Dividends");

        if (this.includeStockSplits)
            headers.push("Stock Splits");

        data.splice(0, 0, headers);

        return data;
    }

}

export {YahooFinanceAPI};