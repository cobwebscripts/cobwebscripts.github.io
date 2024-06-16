/*
    StockManipulator is a class that holds the basic [stock price, CPI] data array and transforms it 
    so that it can be used in the mean reversion model.

    *** NOTES ***
        for...of and for...in are used for different types of iteration
        for...of = used for iterating to get elements in an array
        for...in = used for dictionary like objects that to get all the keys in the dictionary
    ~~~~~
        The "#" is used to denote private methods and attributes in JavaScript
    ~~~~~
        As per MDN, console.log() has a lazy implemenation so if you try to use it like print statements 
        for debugging, you won't print out the object at the moment in code. If you want the object at that 
        moment, you need to do: 
        console.log(JSON.parse(JSON.stringify(obj)));
    ~~~~~

*/

/*
    @import data the SP500TR data set to be used
*/
import {data} from "./data.js";

class StockManipulator
{
    /*
        Class Field Delcarations
        I was considering using private fields denoted with "#" but for now just using best practice.

        @field data Original CPI and stock price 
        @field stockPriceArr Final array of current data's nominal (non-inflation adjusted) prices
        @field stockPriceCoeffs [m, b] array that is used to forecast nominal prices beyond stockPriceArr
        @field stdDevArr Final array of current data's nominal prices standard deviation
        @field stdDevCoeffs [m, b] array that is used to forecast nominal prices standard deviation stdDevArr
            [*] stdDevCoeffs contain the coefficients to calculate the upper standard deviation line 
                (stock price + standard deviation)
            [*] Extra work has to be done to get the forecasted standard deviation value as seen in 
                getForecastStandardDeviationPoint
    */
   data;
   stockPriceArr;
   stockPriceCoeffs;
   stdDevArr;
   stdDevCoeffs;

    constructor()
    {
        this.data = data;
    }

    /*
        Linear Regression
        To calculate the linear regression, I use the least squares method.
        If done properly we will get the "m" (the slope) and "b" (the y-intercept) in y = mx + b.
        To do this we need to calculate:
        [*] N = number of points
        [*] m = (N * SIGMA(X * Y) - (SIGMA(X) * SIGMA(Y))) / ((N * SIGMA(X^2)) - (SIGMA(X))^2)
        [*] Now having "m" we can use it to find b:
        [*] AVG(Y) = m * AVG(X) + b
        [*] b = AVG(Y) - (m * AVG(X))

        Returns a 2 value array containing the slope and y-intercept, respectively, for a least squares linear regression.
        
        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
        @return Two value array: [slope, y-intercept]
    */
    #linearRegression(monthStockArr)
    {
        // First we need to get the average of Y and X
        // Since X in our data will be just the months starting from 0, we can just calculate directly from there:
        let xSum = 0;
        let ySum = 0;
        let xySum = 0;
        let xSquaredSum = 0;
        const numOfPoints = monthStockArr.length;

        // point = [x, y]
        for (const point of monthStockArr)
        {
            xSum += point[0];
            ySum += point[1];
            xySum += point[0] * point[1];
            xSquaredSum += point[0] ** 2;
        }

        // Now we have the averages
        const xAverage = xSum / numOfPoints;
        const yAverage = ySum / numOfPoints;
        
        // For division remember A / B:
        // A = Dividend
        // B = Divisor

        // Dividend
        // (N * SIGMA(X * Y) - (SIGMA(X) * SIGMA(Y)))
        const dividend = (numOfPoints * xySum) - (xSum * ySum);
        
        // Divisor
        // ((N * SIGMA(X^2)) - (SIGMA(X))^2)
        const divisor = (numOfPoints * xSquaredSum) - (xSum ** 2);

        // We have one of our values now: "m" aka the slope.
        const m = dividend/divisor;

        // Now we need to find "b" aka the y-intercept.
        // b = AVG(Y) - (m * AVG(X))
        const b = yAverage - (m * xAverage);

        return [m, b];
    }

    /*
        Linear Regression Forced Through Designated Y-intercept
        To calculate a linear regression through a y-intercept, "b", of your choice you must:
        [*] Decide the y value for "b"
        [*] For every (x, y) pair in data set, you need to add a (-x, 2b - y) to the data set
        [*] Calculate the linear regression with this new data set
        
        Returns a 2 value array containing the slope and y-intercept, respectively, for a least squares linear regression
        through the forced y-intercept.

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
        @param b the desired y-intercept value
        @return Two value array: [slope, y-intercept]
    */
    #forcedYLinearRegression(monthStockArr, b)
    {
        const additionalPnts = [];
        for (const point of monthStockArr)
        {
            let x = point[0];
            let y = point[1];
            
            // Make sure the point where x = 0 is not added to prevent the duplicate y-intercept
            if (x != 0)
            {
                // Add the pair (-x, 2b - y) to the array
                additionalPnts.push([x * -1, (2 * b) - y]);
            }            
        }

        // Do the linear regression on modified data and return the [slope, y-intercept]
        return this.#linearRegression(monthStockArr.concat(additionalPnts));    
    }

    /*
        Linear Regression Forced Through Last Data Point
        To calculate a linear regression through the latest data point, you must:
        [*] Invert the X data points
            [*] For example, if the data points are:
            [*] (0, 0.5), (1, 1.2), (2, 1.9), (3, 3), (4, 4.5)
            [*] Then the X value should be inverted to:
            [*] (4, 0.5), (3, 1.2), (2, 1.9), (1, 3), (0, 4.5)
            [*] Thus changing the slope of the data by multiplying it by -1
        [*] Do a forced y-intercept linear regression on this new data set,
            setting the y-intercept to the first data point's y-value aka (0, Y).
        [*] Save the following from the forced y-intercept regression:
            [*] Last data point as the Y for it will become the Y-intercept in the final output
            [*] The slope, as multiplying it by -1 will give you the final coefficient

        Returns a 2 value array containing the slope and y-intercept, respectively, for a least squares linear regression 
        forced through the last point of the data set.

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
        @return Two value array: [slope, y-intercept]
    */
    #lastPointLinearRegression(monthStockArr)
    {
        // Grab last data point
        const lastPoint = monthStockArr[monthStockArr.length - 1];

        const reverseArr = [];
        
        // Deep clone monthStockArr and reverse
        // To reverse we need to flip our x's thus 
        // [0, y1], [1, y2], [2, y3] becomes 
        // [2, y1], [1, y2], [0, y3]
        //To do this we just subtract the last X point from all other x points
        for (const point of monthStockArr)
        {
            reverseArr.push([(lastPoint[0] - point[0]), point[1]]);
        }

        // Now do Forced y-intercept through last data point line (which is the first data point in the reversed)
        // [0] = m
        // [1] = b
        const lineEq = this.#forcedYLinearRegression(reverseArr, lastPoint[1]);

        // Find slope, "m", and y-intercept, "b", of final, reverted regression line
        // Find y-intercept, "b", of final inverse line
        const m = lineEq[0] * -1;
        const b = lineEq[0] * lastPoint[0] + lastPoint[1];

        return [m, b];
    }

    /*
        Population Standard Deviation
        To calculate:
        [*] Calculate the average of the data
        [*] Subtract each data point from the average and square this value
        [*] Sum up the squared differences of all data points
        [*] Divide this sum by the number of data points, "n"
        [*] Square root this value which gives the standard deviation
        
        TD Ameritrade uses population standard deviation, so I did the same.
        
        I calculated it this way because I wanted to have a running set of standard deviations:
        [*] Running sum of y = Running_SIGMA(Y)
        [*] Running sum of y^2 = Running SIGMA(Y^2)
        [*] N = number of points up to the current point
        [*] SD = SQRT((N * Running_SIGMA(Y^2)) - (Running_SIGMA(Y))^2)) / N

        Source: https://en.wikipedia.org/wiki/Standard_deviation#Rapid_calculation_methods

        The difference between population and sample standard deviation is that population divides by "n" data values,
        while sample divides by "n-1". The reason for this is because when we calculate the average, if we are using 
        the sample data, the distance being measured will be from the sample average rather than the population average.
        Now this is unavoidable, but statisticians have found that data points tend to be closer to their sample average 
        than the population average, thus we compensate by doing "n-1". This gives us a smaller number as the divisor to 
        compensate for the fact that the distances will be slightly smaller.

        Source: https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1008&context=imseteach

        Returns a 2-D array holding the month number and the standard deviation with the data up to and including that month's data.

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
        @return a 2-D array holding a list of pairs containing the [month, standard deviation]
    */
    #standardDeviation(monthStockArr)
    {
        /* 
            My approach here is to do this in linear time, thus I will keep track of the running sigma
            and count and keep adding to them.
        */
        const stdDevs = [];
        let count = 1;
        let dataSum = 0;
        let squaredDataSum = 0;

        for (const point of monthStockArr)
        {
            dataSum += point[1];
            squaredDataSum += point[1] ** 2;
            
            const stdDev = (((count * squaredDataSum) - (dataSum ** 2)) ** (1/2)) / count;

            stdDevs.push([point[0], stdDev]);
            count += 1;
        }

        return stdDevs;
    }

    /*
        Modifies array in-place so that the 2-D array becomes pairs of [month number, LN(stock price)] 
        from pairs of [month number, stock price].

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
    */
    #linearize(monthStockArr)
    {
        for (let i = 0; i < monthStockArr.length; i++)
        {
            // Deal with if "y" value (aka a stock price/standard deviation value) is 0
            // We just leave the value 0 for our purposes
            if (monthStockArr[i][1] != 0)
            {
                monthStockArr[i][1] = Math.log(monthStockArr[i][1]);
            }
        }
    }

    /*
        Modifies array in-place so that the 2-D array becomes pairs of [month number, stock price] 
        from pairs of [month number, LN(stock price)].

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, LN(stock price)] as a two value array
    */
    #unlinearize(monthStockArr)
    {
        for (let i = 0; i < monthStockArr.length; i++)
        {
            // Deal with if "y" value (aka a stock price/standard deviation value) is 0
            // We just leave the value 0 for our purposes
            if (monthStockArr[i][1] != 0)
            {
                monthStockArr[i][1] = Math.exp(monthStockArr[i][1]);
            }
        }
    }

    /*
        Modifies array in-place so that the 2-D array becomes pairs of [month number, inflation adjusted stock price]
        from pairs of [month number, stock price].

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, stock price] as a two value array
    */
   #adjustForInflation(monthStockArr)
   {
        const startingInfl = this.data[0][1];

        for (let i = 0; i < monthStockArr.length; i++)
        {
            const ratio = startingInfl / this.data[i][1];

            // Set inflation adjusted price
            monthStockArr[i][1] = monthStockArr[i][1] * ratio;
        }
   }

   /*
        Modifies array in-place so that the 2-D array becomes pairs of [month number, stock price]
        from pairs of [month number, inflation adjusted stock price].

        @param monthStockArr a 2-D array where each element contains the pair 
            [month number, inflation adjusted stock price] as a two value array
   */
   #unadjustForInflation(monthStockArr)
   {
        const startingInfl = this.data[0][1];

        for (let i = 0; i < monthStockArr.length; i++)
        {
            const ratio = startingInfl / this.data[i][1];

            // Remove inflation from stock price
            monthStockArr[i][1] = monthStockArr[i][1] / ratio;
        }
    }

    /*
        This function is needed to prepare data for the following functions:
        [*] linRegression
        [*] forcedYLinRegression
        [*] lastPointLinRegression
        [*] standardDeviation
        [*] linearize
        [*] unlinearize
        [*] adjustForInflation
        [*] unadjustForInflation

        Returns a 2-D array containing pairs of [month number, stock price].

        @return 2-D array containing pairs of month number and stock price
    */
   #prepareData()
   {
        const preppedData = [];

        for (let i = 0; i < this.data.length; i++)
        {
            const price = this.data[i][0];
            preppedData.push([i, price]);
        }

        return preppedData;
   }

   /*
        Generates the stock data for the site up to the inflation data that we have, 
        and assign the 2-D array containing pairs of [month number, stock price] to stockPriceArr.
   */
   #generateCurrentPriceData()
   {
        // Prep data
        // monthStkData = month and stock data 
        const monthStkData = this.#prepareData();
        
        //Inflation adjustment
        this.#adjustForInflation(monthStkData);

        // Linearize data
        this.#linearize(monthStkData);
        
        // Do last point regression on data
        //const lineCoeffs = this.#lastPointLinearRegression(monthStkData);
        const lineCoeffs = this.#linearRegression(monthStkData);

        // Create array using data from regression
        const monthStkRegData = [];
        for (let i = 0; i < monthStkData.length; i++)
        {
            // y = mx + b
            // Price = lineCoeffs[0] * i + lineCoeffs[1]
            monthStkRegData.push([i, ((lineCoeffs[0] * i) + lineCoeffs[1])]);
        }

        // Unlinearize data
        this.#unlinearize(monthStkRegData);

        // Reverse inflation adjustment
        this.#unadjustForInflation(monthStkRegData);
        
        // Save array of final data of stock prices
        this.stockPriceArr = monthStkRegData;
   }

   /*
        Generates the coefficients [m, b] to be used to forecast stock price data passed what is 
        in stockPriceArr and assigns the [m, b] to stockPriceCoeffs.  You need to use these 
        coefficients as so:
        predicted stock price = e^((m * x) + b)
   */
   #generateForecastPriceEquation()
   {
        // Linearize data
        this.#linearize(this.stockPriceArr);

        // Do last point regression
        this.stockPriceCoeffs = this.#lastPointLinearRegression(this.stockPriceArr);

        // Since linearize changes data in place and the data is going to be used later we need to 
        // unlinearize the data.
        this.#unlinearize(this.stockPriceArr);
   }

   /*
        We will find the standard deviation on the original stock price data. 

        Generates the stock standard deviation data for the site up to the data that we have, 
        and assign the 2-D array containing pairs of [month number, standard dev] to stdDevArr.
   */
   #generateCurrentStandardDeviationData()
   {
        // Return standard deviation using function
        // Set the stdDevArr property
        this.stdDevArr = this.#standardDeviation(this.#prepareData());
   }
   /*
        Creating a forecast based on the current standard deviation values does not work well 
        because even with linearizing the data, it holds a logarithmic shape rather than a 
        linear one. So what you can do to get around this is:
        [*] Add the standard deviation data to the stock data and then analyze that
        [*] When it comes time to get the forecasted standard deviation, you simply 
            subtract the forecasted standard deviation from the forecasted stock data 
            [*] If you do not subtract you will have the upper standard deviation line directly 
                which is fine, but you need to know the standard deviation so you can calculate 
                the lower curve as well.

        Generates the coefficients [m, b] to be used to forecast stock price data passed what is 
        in stockPriceArr and assigns the [m, b] to stdDevCoeffs.  You need to use these 
        coefficients as so:
        predicted standard deviation = e^((m * x) + b)
   */
   #generateForecastStandardDeviationEquation()
   {
        const upperStdDevLine = [];

        // stockPriceArr and stdDevArr should be the same length
        // Add standard deviation to inflation adjusted data to get upper standard deviation line
        for (let i = 0; i < this.stockPriceArr.length; i++)
        {
            upperStdDevLine.push([i, this.stockPriceArr[i][1] + this.stdDevArr[i][1]]);
        }

        // Linearize data 
        this.#linearize(upperStdDevLine);   

        // Do last point regression
        // Set the property stdDevCoeffs
        this.stdDevCoeffs = this.#lastPointLinearRegression(upperStdDevLine);

        // We do not need to unlinearize as this data is not relevant anymore
        //this.#unlinearize(upperStdDevLine);
   }

   /*
        Uses the data generation functions to fill all the fields for the object. You need to 
        call this function before using the following:
        [*] getCurrentPricePoint
        [*] getForecastPricePoint
        [*] getCurrentStandardDeviationPoint
        [*] getForecastStandardDeviationPoint
   */
   generateAll()
   {
        this.#generateCurrentPriceData();
        this.#generateForecastPriceEquation();
        this.#generateCurrentStandardDeviationData();
        this.#generateForecastStandardDeviationEquation();
   }

   /*
        Returns the stock price from the current data set.

        @param dateIndex A date converted to represent an index within the stockPriceArr
        @return the stock price at the requested index
   */
   getCurrentPricePoint(dateIndex)
   {
        return this.stockPriceArr[dateIndex][1];
   }

   /*
        Returns the stock price that is forecasted outside of the data set.

        @param dateIndex A date converted to represent an index outside the stockPriceArr
        @return the stock price at the requested index
   */
   getForecastPricePoint(dateIndex)
   {
        return Math.exp((dateIndex * this.stockPriceCoeffs[0]) + this.stockPriceCoeffs[1]);
   }

   /*
        Returns the standard deviation value from the current data set.

        @param dateIndex A date converted to represent an index within the stdDevArr
        @return the standard deviation value at the requested index
   */
   getCurrentStandardDeviationPoint(dateIndex)
   {
        return this.stdDevArr[dateIndex][1];
   }

   /*
        Returns the standard deviation value that is forecasted outside of the data set.

        @param dateIndex A date converted to represent an index outside the stdDevArr
        @return the standard deviation value at the requested index
   */
   getForecastStandardDeviationPoint(dateIndex)
   {
        const sdPoint = Math.exp((dateIndex * this.stdDevCoeffs[0]) + this.stdDevCoeffs[1]);
        const stkPoint = Math.exp((dateIndex * this.stockPriceCoeffs[0]) + this.stockPriceCoeffs[1]);
        return (sdPoint - stkPoint);
   }

   /*
        Returns the length of the data set.

        @return the length of data set
   */
   getDataLength()
   {
    return this.data.length;
   }

}

export {StockManipulator};