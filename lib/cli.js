"use strict";
var generator = require("./sequelize-auto-ts");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var prompt = require("prompt");
console.log("sequelize-auto-ts");
console.log("");
console.log("Automatically generate sequelize definition statements and TypeScript types for your database.");
console.log("");
if (process.argv.length > 2) {
    processFromCommandLines();
}
else {
    processFromPrompt();
}
function processFromCommandLines() {
    var args = process.argv.slice(2);
    var modelFactory = false;
    var i = args.indexOf('-mf');
    if (i !== -1) {
        modelFactory = true;
        args.splice(i, 1);
    }
    var settingsJSON = (args.length === 1) ? loadSettings(args[0]) : {
        database: args[0],
        username: args[1],
        password: args[2],
        targetDirectory: args[3]
    };
    if (!args.length || (!settingsJSON && args.length < 4)) {
        showHelp();
        process.exit(1);
    }
    var options = _.merge({
        modelFactory: modelFactory,
        options: null
    }, settingsJSON);
    generate(options);
}
function loadSettings(filePath) {
    var json = loadJSON(filePath);
    if (!json) {
        var fileName = path.basename(filePath);
        json = loadJSON(fileName);
        if (!json) {
            json = loadFileFromParentDir(fileName);
        }
    }
    return json;
}
function loadFileFromParentDir(filePath, limit) {
    if (limit === void 0) { limit = 10; }
    if (!limit)
        return;
    limit--;
    filePath = '../' + filePath;
    var raw = loadJSON(filePath);
    if (!raw) {
        raw = loadFileFromParentDir(filePath, limit);
    }
    return raw;
}
function loadJSON(jsonPath) {
    try {
        var raw = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(raw);
    }
    catch (e) {
        return;
    }
}
function processFromPrompt() {
    var schema = {
        properties: {
            database: { description: "Database name", required: true },
            username: { description: "Username", required: true },
            password: { description: "Password", required: false, hidden: true },
            targetDirectory: { description: "Target directory", required: true }
        }
    };
    prompt.start();
    prompt.get(schema, function (err, result) {
        result.options = null;
        generate(result);
    });
}
function generate(options) {
    console.log("Database: " + options.database);
    console.log("Username: " + options.username);
    console.log("Password: <hidden>");
    console.log("Target  : " + options.targetDirectory);
    console.log("");
    if (!fs.existsSync(options.targetDirectory)) {
        showHelp();
        throw Error("Target directory does not exist: " + options.targetDirectory);
    }
    generator.generate(options, function (err) {
        if (err) {
            throw err;
        }
    });
}
function showHelp() {
    console.log("");
    console.log("Option 1: Command line arguments");
    console.log("");
    console.log("    sequelize-auto-ts settingsFile");
    console.log("");
    console.log("            settingsFile    - The path of the file for settings");
    console.log("");
    console.log("    or");
    console.log("");
    console.log("    sequelize-auto-ts database username password targetDirectory");
    console.log("");
    console.log("            database        - The name of the local database to generate typings/definitions from");
    console.log("            username        - database user with access to read from database");
    console.log("            password        - password for user");
    console.log("            targetDirectory - The directory where generated files should be placed");
    console.log("");
    console.log("Option 2: Interactive");
    console.log("");
    console.log("    sequelize-auto-ts");
    console.log("");
    console.log("            This will launch in interactive mode where user will be prompted for all required inputs.");
    console.log("");
}
