var $ = require("jquery"); // eslint-disable-line
var Papa = require('papaparse'); // eslint-disable-line
// var bootstrap = require("bootstrap"); // eslint-disable-line

var config = buildConfig();
var inputType = "string";
var stepped = 0, rowCount = 0, errorCount = 0, firstError;
var start, end;

$( document ).ready(function() {
    $("#submit").click(function() {
        if (!$("#files")[0].files.length) {
            alert("Please choose at least one file to parse.");
            return enableButton();
        }

        Papa.parse($("#files")[0].files[0], config);
    });
});

function printStats(msg)
{
    if (msg)
        console.log(msg);
    console.log("       Time:", (end-start || "(Unknown; your browser does not support the Performance API)"), "ms");
    console.log("  Row count:", rowCount);
    if (stepped)
        console.log("    Stepped:", stepped);
    console.log("     Errors:", errorCount);
    if (errorCount)
        console.log("First error:", firstError);
}



function buildConfig()
{
    return {
        delimiter: $("#delimiter").val(),
        header: $("#header").prop("checked"),
        dynamicTyping: $("#dynamicTyping").prop("checked"),
        skipEmptyLines: $("#skipEmptyLines").prop("checked"),
        preview: parseInt($("#preview").val() || 0),
        step: $("#stream").prop("checked") ? stepFn : undefined,
        encoding: $("#encoding").val(),
        worker: $("#worker").prop("checked"),
        comments: $("#comments").val(),
        complete: completeFn,
        error: errorFn,
        download: inputType == "remote"
    };
}

function stepFn(results, parser)
{
    stepped++;
    if (results)
    {
        if (results.data)
            rowCount += results.data.length;
        if (results.errors)
        {
            errorCount += results.errors.length;
            firstError = firstError || results.errors[0];
        }
    }
}

function completeFn(results)
{
    end = now();

    if (results && results.errors)
    {
        if (results.errors)
        {
            errorCount = results.errors.length;
            firstError = results.errors[0];
        }
        if (results.data && results.data.length > 0)
            rowCount = results.data.length;
    }

    printStats("Parse complete");
    console.log("    Results:", results);

    // icky hack
    setTimeout(enableButton, 100);
}

function errorFn(err, file)
{
    end = now();
    console.log("ERROR:", err, file);
    enableButton();
}

function enableButton()
{
    $("#submit").prop("disabled", false);
}

function now()
{
    return typeof window.performance !== "undefined"
        ? window.performance.now()
        : 0;
}