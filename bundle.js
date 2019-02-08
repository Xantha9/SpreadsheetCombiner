let $ = require("jquery"); // eslint-disable-line
let Papa = require('papaparse'); // eslint-disable-line
// let bootstrap = require("bootstrap"); // eslint-disable-line

// Declare universal
let headings = [], numberHeadings = {}, data = {}, identifier = "";

$( document ).ready(function() {
    // Trigger combines and return result on click
    $("#submit").click(function() {
        let files = $("#files")[0].files;

        // Check for input
        if (!files.length) {
            alert("Please choose at least one file to parse.");
        }
        else {
            // Read in nonfinal data
            for (let i = 0; i < files.length - 1; i++) {
                Papa.parse(files[i], {
                    skipEmptyLines: true,
                    complete: readData,
                    error: errorFn,
                    download: false
                });
            }

            // Read final file, then compose csv
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
                // Add identifier
                csvrow = row;

                // Iterate over remaining columns
                for (let i = 1; i < headings.length; i++) {
                    csvrow += ",";

                    // Get entry
                    let entry = data[row][headings[i]];

                    // If entry exists
                    if (entry != null) {
                        if (typeof(entry) === "string") {
                            // Add entry and add commas for duplicates
                            csvrow += entry;
                            csvrow += ",".repeat(numberHeadings[headings[i]] - 1);
                        }

                        // Entry is an array
                        else {
                            // Add first entry
                            csvrow += entry[0];

                            // Add remaining entries
                            for (let j = 1; j < entry.length; j++) {
                                csvrow += "," + entry[j];
                            }

                            // Add commas for duplicates, accounting for duplicates already added
                            csvrow += ",".repeat(numberHeadings[headings[i]] - entry.length);
                        }
                    }

                    // Add commas if entry does not exist
                    else {
                        csvrow += ",".repeat(numberHeadings[headings[i]] - 1);
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
    let idCol = [];

    // Proceed if csv is not empty
    if (rawData.length > 0) {
        // Set identifier
        if (identifier === "") {
            identifier = rawData[0][0];
        }

        // Iterate over first row
        for (let i = 0; i < rawData[0].length; i++) {
            let heading = rawData[0][i];

            // TODO: first heading is blank? Throw error
            // Handle empty heading
            heading = findLastHead(heading, rawData[0], i);

            // Keep track of which columns are identifiers
            if (heading === identifier) {
                idCol.push(i);
            }

            // Check if heading has been found
            if (numberHeadings[heading] == null) {
                // Add to heading list and make number 1
                numberHeadings[heading] = 1;
                headings.push(heading);
            }
        }

        // Create list of non unique columns
        let nonUnique = [];

        let i = 0; // Iterate over headings
        let j = 0; // Iterate through identifying columns

        while (i < rawData[0].length) {
            // If column is not identifying, add to list
            if (idCol[j] !== i) {
                nonUnique.push(i);
            }

            // If column is identifying, iterate to next identifying
            else {
                j++;
            }
            i++;
        }

        // Iterate over rows
        for (let row = 1; row < rawData.length; row++) {
            let entryName = rawData[row][idCol[0]];

            // If entry does not exist yet, create entry for first identifier
            if (data[entryName] == null) {
                data[entryName] = {};
            }

            // Iterate over columns
            for (let col = 0; col < nonUnique.length; col++) {
                let colHead = rawData[0][nonUnique[col]];
                let newEntry = rawData[row][nonUnique[col]];

                // If the heading is blank, find the last heading
                if (colHead === "") {
                    colHead = findLastHead(colHead, rawData[0], nonUnique[col]);
                }

                // If newEntry is not blank
                if (newEntry !== "") {
                    let entry = data[entryName][colHead];

                    // If current entry does not exist set equal to new entry
                    if (entry == null) {
                        data[entryName][colHead] = newEntry;
                    }

                    // Else if one exists replace with array, if not duplicate
                    else if (numberHeadings[colHead] === 1) {
                        if (entry !== newEntry) {
                            data[entryName][colHead] = [entry, newEntry];
                            numberHeadings[colHead]++;
                        }
                    }

                    // If array already exists, check if not duplicate, then add to array
                    else {
                        if (!entry.includes(newEntry)) {
                            data[entryName][colHead].push(newEntry);
                            numberHeadings[colHead]++;
                        }
                    }
                }
            }

            // Iterate over remaining identifier columns
            for (let i = 1; i < idCol.length; i++) {
                let copyName = rawData[row][idCol[i]];

                // If column is not empty, copy object
                if (copyName !== "") {
                    data[copyName] = Object.assign({}, data[entryName]);
                }
            }

        }
    }
}

// Read data, then generate csv and download
function finalFile(results) {
    readData(results);
    returnResult();
}

// Log any errors to console
function errorFn(err, file) {
    console.log("ERROR:", err, file);
}

// Determine if object has parameters
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

// Iterate back through columns to find last heading
function findLastHead(heading, headingCols, i) {
    let j = i - 1;
    while (heading === "") {
        heading = headingCols[j];
        j--;
    }
    return heading;
}
