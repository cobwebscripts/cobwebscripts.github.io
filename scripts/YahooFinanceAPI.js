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
*/

class YahooFinanceAPI
{


    // Class Field Declarations
    startDate;
    endDate;
    ticker;
    timeResolution;

    constructor(ticker, timeResolution, startDate = null, endDate = null)
    {
        this.ticker = ticker;
        this.timeResolution = timeResolution;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /*
        Asynchronously fetches and returns JSON from URL.
    */
    async retrieveJson()
    {
        const corsBypassUrl = 'https://corsproxy.io/?' + encodeURIComponent(this.#createUrl());
        const response = await fetch(corsBypassUrl);
        const stockJson = await response.json(); 

        return stockJson;
    }

    #createUrl()
    {
        // I set the range to 1000 years so capture all data
        return "https://query1.finance.yahoo.com/v8/finance/chart/"
            + this.ticker
            + "?range=1000y&interval="
            + this.timeResolution
            + "&includePrePost=true&events=div%7Csplit%7Cearn";
    }

    /*
        Convert seconds since epoch to string date YYYY-MM-DD.
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

    #getTimestamps(stockJson)
    {
        return stockJson.chart.result[0].timestamp;
    }

    #getOpens(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].open;
    }

    #getHighs(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].high;
    }

    #getLows(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].low;
    }

    #getCloses(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].close;
    }

    #getVolumes(stockJson)
    {
        return stockJson.chart.result[0].indicators.quote[0].volume;
    }

    #getAdjCloses(stockJson)
    {
        return stockJson.chart.result[0].indicators.adjclose[0].adjclose;
    }

    #getDividends(stockJson)
    {
        let dividends;
        // If not undefined assigned
        if (stockJson.chart.result[0].events !== undefined 
            && stockJson.chart.result[0].events.dividends !== undefined)
            dividends = stockJson.chart.result[0].events.dividends;
        else
            return [];

        const output = [];
        for (const div in dividends)
        {
            // Bracket notation has to be used to use variable "div" to access JSON data [1].
            // JSON uses the same dot/bracket notation as JavaScript objects [2].
            // Sources:
            // [1] https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics
            // [2] https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
            const time = stockJson.chart.result[0].events.dividends[div].date;
            let amount = stockJson.chart.result[0].events.dividends[div].amount;
            amount = amount.toString() + " Dividend";
            output.push([time, amount]);
        }

        return output;
    }

    #getSplits(stockJson)
    {
        let splits;

        if (stockJson.chart.result[0].events !== undefined 
            && stockJson.chart.result[0].events.splits !== undefined)
            splits = stockJson.chart.result[0].events.splits;
        else
            return [];

        const output = [];
        for (const split in splits)
        {
            const time = stockJson.chart.result[0].events.splits[split].date;
            let splitRatio = stockJson.chart.result[0].events.splits[split].splitRatio;
            splitRatio = splitRatio + " Stock Splits";
            output.push([time, splitRatio]);
        }

        return output;
    }

    compileData(stockJson)
    {
        const timestamps = this.#getTimestamps(stockJson);
        const opens = this.#getOpens(stockJson);
        const highs = this.#getHighs(stockJson);
        const lows = this.#getLows(stockJson);
        const closes = this.#getCloses(stockJson);
        const volumes = this.#getVolumes(stockJson);
        const adjCloses = this.#getAdjCloses(stockJson);

        const dividends = this.#getDividends(stockJson);
        const splits = this.#getSplits(stockJson);

        let compiledData = [];


        for (let i = 0; i < timestamps.length; i++)
        {
            compiledData.push([timestamps[i], opens[i], highs[i], lows[i], closes[i]
                , adjCloses[i], volumes[i]]);
        }

        compiledData = compiledData.concat(dividends);
        compiledData = compiledData.concat(splits);

        // You have to customize sort function to handle complex arrays [1].
        // Source:
        // [1] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
        compiledData.sort((a, b) => a[0] - b[0]);

        for (let i = 0; i < compiledData.length; i++)
        {
            compiledData[i][0] = this.#secondsToDate(compiledData[i][0]);
        }

        // See if start and end defined as not null
        if (this.startDate)
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
        console.log(JSON.parse(JSON.stringify(compiledData)));
        console.log(JSON.parse(JSON.stringify(this.#addHeaders(compiledData))));
        return compiledData;
    }

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

        data.splice(0, 0, headers);

        return data;
    }


}


export {YahooFinanceAPI};