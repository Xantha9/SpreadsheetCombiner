let $ = require("jquery"); // eslint-disable-line
let Papa = require('papaparse'); // eslint-disable-line
// let bootstrap = require("bootstrap"); // eslint-disable-line

let i, j;
let headings = [], numberHeadings = {}, data = {};
let config = {
    delimiter: $("#delimiter").val(),
    headings: $("#headings").prop("checked"),
    dynamicTyping: $("#dynamicTyping").prop("checked"),
    skipEmptyLines: $("#skipEmptyLines").prop("checked"),
    preview: parseInt($("#preview").val() || 0),
    encoding: $("#encoding").val(),
    worker: $("#worker").prop("checked"),
    comments: $("#comments").val(),
    complete: completeFn,
    error: errorFn,
    download: false
};

$( document ).ready(function() {
    $("#submit").click(function() {
        let files = $("#files")[0].files;
        if (!files.length) {
            alert("Please choose at least one file to parse.");
        }

        for (i = 0; i < files.length; i++) {
            Papa.parse(files[i], config);
        }
    });
});

function completeFn(results)
{
    readData(results.data);

    // Return file to user
    let csvContent = "data:text/csv;charset=utf-8,";
    let csvrow = "";
    for (i = 0; i < headings.length - 1; i++) {
        csvrow += headings[i];
        csvrow += ", ".repeat(numberHeadings[headings[i]]);
    }

    csvContent += csvrow + headings[headings.length - 1] + "\r\n";

    for (let entry in data) {
        if (data.hasOwnProperty(entry)) {
            csvrow = "";
            for (i = 0; i < headings.length; i++) {
                csvrow += headings[i];
                csvrow += ", ".repeat(numberHeadings[headings[i]]);
            }

            csvContent += csvrow + "\r\n";
        }
    }

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "combined.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
}

// TODO: handle empty case
function readData(rawData) {

    for (i = 0; i < rawData[0].length; i++) {
        let heading = rawData[0][i];

        if (numberHeadings[heading] == null) {
            numberHeadings[heading] = 1;
            headings.push(heading);
        }
    }

    for (let row = 1; row < rawData.length; row++) {
        if (data[rawData[row][0]] == null) {
            data[rawData[row][0]] = {};
        }

        for (let col = 1; col < rawData[row].length; col++) {
            let entry = data[rawData[row][0]][rawData[0][col]];
            let newEntry = rawData[row][col];

            if (entry == null) {
                data[rawData[row][0]][rawData[0][col]] = newEntry;
            }
            else if (numberHeadings[rawData[0][col]] === 1) {
                if (entry != newEntry) {
                    data[rawData[row][0]][rawData[0][col]] = [entry, newEntry];
                    numberHeadings[rawData[0][col]]++;
                }
            }
            else {
                if (!entry.includes(newEntry)) {
                    data[rawData[row][0]][rawData[0][col]].push(newEntry);
                    numberHeadings[rawData[0][col]]++;
                }
            }
        }
    }
    console.log("data", data);
}

function errorFn(err, file) {
    console.log("ERROR:", err, file);
}
