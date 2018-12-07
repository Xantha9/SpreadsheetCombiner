let $ = require("jquery"); // eslint-disable-line
let Papa = require('papaparse'); // eslint-disable-line
// let bootstrap = require("bootstrap"); // eslint-disable-line

// Declare universal
let headings = [], numberHeadings = {}, data = {};

$( document ).ready(function() {
    // Trigger combines and return result on click
    $("#submit").click(function() {
        let files = $("#files")[0].files;

        // Check for input
        if (!files.length) {
            alert("Please choose at least one file to parse.");
        }
        else {
            // Read in data with 'complete function', readData
            for (let i = 0; i < files.length - 1; i++) {
                Papa.parse(files[i], {
                    skipEmptyLines: true,
                    complete: readData,
                    error: errorFn,
                    download: false
                });
            }

            Papa.parse(files[files.length - 1], {
                skipEmptyLines: true,
                complete: finalFile,
                error: errorFn,
                download: false
            });
        }
    });
});

function returnResult() {
    // Define filetype
    let csvContent = "data:text/csv;charset=utf-8,";

    // Proceed if data is not empty
    if (!isEmpty(data)) {
        // Title row
        let csvrow = "";

        // Iterate over headings
        for (let i = 0; i < headings.length - 1; i++) {
            csvrow += headings[i];

            // Add extra columns for conflicts
            csvrow += ",".repeat(numberHeadings[headings[i]]);
        }

        // Add last column and add new line
        csvContent += csvrow + headings[headings.length - 1] + "\r\n";

        // Iterate over remaining rows
        for (let row in data) {
            if (data.hasOwnProperty(row)) {
                csvrow = row;

                // Iterate over columns
                for (let col in data[row]) {
                    if (data[row].hasOwnProperty(col)) {
                        csvrow += "," + data[row][col];

                        // Add extra columns for conflicts
                        if (data[row][col].length == null) {
                            csvrow += ",".repeat(numberHeadings[col] - 1);
                        }
                        else {
                            csvrow += ",".repeat(numberHeadings[col] - data[row][col].length);
                        }
                    }
                }
            }
            // Add new line
            csvContent += csvrow + "\r\n";
        }
    }

    // Download file
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "combined.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
}


function readData(results) {
    let rawData = results.data;
    let identifier = 0;

    // Proceed if csv is not empty
    if (rawData.length > 0) {
        // Iterate over first row
        for (let i = 0; i < rawData[0].length; i++) {

            let heading = rawData[0][i];

            // Check if heading has been found
            if (numberHeadings[heading] == null) {
                // Add to heading list and make number 1
                numberHeadings[heading] = 1;
                headings.push(heading);
            }
            else if (heading == headings[0]) {
                // TODO: multiple columns of unique
                identifier = i;
            }
        }

        // Iterate over rows
        for (let row = 1; row < rawData.length; row++) {
            // If entry does not exist yet, create entry
            if (data[rawData[row][identifier]] == null) {
                data[rawData[row][identifier]] = {};
            }

            // Iterate over columns
            for (let col = 0; col < rawData[row].length; col++) {
                if (col != identifier) {
                    let entry = data[rawData[row][identifier]][rawData[0][col]];
                    let newEntry = rawData[row][col];

                    // If current entry does not exist set equal to new entry
                    if (entry == null) {
                        data[rawData[row][identifier]][rawData[0][col]] = newEntry;
                    }

                    // Else if one exists replace with array, if not duplicate
                    else if (numberHeadings[rawData[0][col]] === 1) {
                        if (entry != newEntry) {
                            data[rawData[row][identifier]][rawData[0][col]] = [entry, newEntry];
                            numberHeadings[rawData[0][col]]++;
                        }
                    }
                    // If array already exists, check if not duplicate, then add to array
                    else {
                        if (!entry.includes(newEntry)) {
                            data[rawData[row][identifier]][rawData[0][col]].push(newEntry);
                            numberHeadings[rawData[0][col]]++;
                        }
                    }
                }
            }
        }
    }
}
function finalFile(results) {
    readData(results);
    returnResult();
}

function errorFn(err, file) {
    // Print error
    console.log("ERROR:", err, file);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
