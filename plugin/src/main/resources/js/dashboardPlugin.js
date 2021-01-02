/**
 * @file
 * Functionality of the ethical analysis dashboard plugin.
 */


/** [ETHICAL_SSE] Example function how to use fetch() to retrieve data. */
function fetchData() {
    // Send some data in your request
    var formData = new FormData();
    formData.append("app", "jira");

    // Send a "POST" (may also be e.g. "GET") request
    var fetchBody = {
        method: "POST",
        mode: "no-cors",
        body: formData
    };

    fetch("http://httpbin.org/post", fetchBody);
};


/** [ETHICAL_SSE] Example function showing how to access the Jira API.
    Also an example that shows how to call a function only *after* a specific field has been set. */
function getCurrentlyLoggedInUserThen(execute_function) {
    // Recursion end condition: currentUser is set
    if (currentUser !== undefined && currentUser !== "") {
        execute_function();
        return;
    }

    // Access the Jira API
    fetch("/jira/rest/auth/1/session")
        .then(function (result) {
            if (result.ok) {
                // Successful request: Return the JSON payload
                return result.json();
            } else {
                // Request error: Log and return undefined
                console.error("JIRA API call failed");
                return undefined;
            }
        })
        .then(function (resultJson) {
            if (resultJson !== undefined && resultJson !== "") {
                // In JavaScript, you can directly access JSON properties
                currentUser = resultJson.name;

                // Recursion / reentrance
                // After we have finished, we recursively call this function again,
                // this time calling the function to execute. Why this two-step
                // process? If we call this function again later, it will
                // immediately call the given function.
                getCurrentlyLoggedInUserThen(execute_function);
            }

            // In case we did not receive a valid user, we don't execute the function.
            return;
        });

    // Recursion / reentrance happens in the callback above
    return;
};


// [ETHICAL_SSE] Below are three example functions how to create HTML elements in JavaScript


/**
 * Creates an HTML <div> element styled as an alert with the given level and text.
 * 
 * @param {String} warning_level
 *   Either "warning" or "danger"
 * @param {Array} warning_text_children
 *   The HTML elements describing the warning text.
 */
function createHtmlAlert(warning_level, warning_text_children) {
    if (["warning", "danger"].indexOf(warning_level) < 0) {
        throw "warning_level has to be either \"warning\" or \"danger\"";
    }

    var alert = document.createElement("DIV");
    alert.className = "alert alert-" + warning_level;
    alert.setAttribute("role", "alert");
    warning_text_children.forEach(function (warning_text_child) {
        alert.appendChild(warning_text_child);
    });

    return alert;
};


/**
 * Creates an HTML <a> element linking to the given user.
 * 
 * @param {String} username
 *   The username (may not contain "@")
 */
function createUserLink(username) {
    if (username.includes("@")) {
        throw "user_name may not contain \"@\"";
    }

    var a = document.createElement("A");
    a.setAttribute("target", "_parent"); // This ensures that we open the relative link in Jira, not in our plugin.
    a.setAttribute("href", "/jira/secure/ViewProfile.jspa?name=" + username);
    a.className = "alert-link";
    a.innerHTML = "@" + username;

    return a;
};


/** Creates an HTML <span> element containing the given text. */
function createSpan(text) {
    var s = document.createElement("SPAN");
    s.innerHTML = text;
    return s;
};


/** Here, we simply populate the interface with some dummy elements. */
function populate() {
    // 1. Load warnings
    console.warn("WARNINGS ARE CURRENTLY FAKE!");
    var warnings = [
        { level: "danger", children: [createSpan("(!) Debug code – warnings are fake (!)")] },
        { level: "warning", children: [createUserLink("frauke"), createSpan(" worked overtime three days in a row.")] },
        { level: "danger", children: [createUserLink("admin"), createSpan(" has violated the policy \"no-work-during-holidays\"!")] },
        { level: "danger", children: [createUserLink("frauke"), createSpan(" worked overtime five days in a row.")] },
        { level: "warning", children: [createSpan("There are 10 open and overdue tasks!")] },
    ];

    // Select the HTML element with the ID "alertlist"
    var alertlist = document.querySelector("#alertlist");

    // 2. Remove "Loading..." placeholder
    if (alertlist.childElementCount != 1) {
        throw "Invalid DOM state!";
    }
    alertlist.removeChild(alertlist.children[0]);

    // 3. Populate interface
    warnings.forEach(function (warning) {
        var warning_alert = createHtmlAlert(warning.level, warning.children);
        alertlist.appendChild(warning_alert);
    });
};

// [ETHICAL_SSE] If you want to immediately run a function when importing the JavaScript, simply trigger it here.
// Alternatively, you may also let them be called from the HTML, e.g. when pressing a button: https://www.w3schools.com/jsref/event_onclick.asp
populate();
