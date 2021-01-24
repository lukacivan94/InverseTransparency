/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------

const users = [];
var currentUser;
const issues = [];
const viewers = [];
const requestors = [];


function acceptRequestor() {
    console.log("acceptRequestor method called");
    var formData = {
        "update": {
            "customfield_10000": [{ "add": { "name": "Stefan" } }]
        }
    }

    var fetchBody = {
        method: "PUT",
        headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json"
        },
        body: {
            "update": {
                "customfield_10000": [{ "add": { "name": "Stefan" } }]
            }
        }
    };
    fetch("/jira/rest/api/2/issue/TP-3/editmeta")
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                console.log("[ERROR]: " + response.json())
                return undefined;
            }
        }).then(function (resultJson) {
            if (resultJson !== undefined) {
                console.log("Answer: " + JSON.stringify(resultJson));
            }
        });
    fetch("/jira/rest/api/2/issue/TP-3", fetchBody)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                return undefined;
            }
        }).then(function (resultJson) {
            if (resultJson !== undefined) {
                console.log("Answer: " + JSON.stringify(resultJson));
            }
        });
};


/**
 * This function gets the name of the logged in user and  stores it in current user
 */
function getLoggedInUser() {
    fetch("/jira/rest/auth/latest/session")
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                return undefined;
            }
        })
        .then(function (resultJson) {
            if (resultJson !== undefined) {
                currentUser = resultJson.name
                console.log("Logged in user is: " + currentUser);
                getIssuesOfUser(currentUser);
            }
        });
};

/**
 * This function gets all issues from the user and stores them in issues.
 */
function getIssuesOfUser(user) {
    console.log("Current user is: " + user);
    fetch("/jira/rest/api/2/search?jql=assignee=" + user)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                return undefined;
            }
        })
        .then(function (resultJson) {
            if (resultJson !== undefined) {
                //console.log("Issues here: " + JSON.stringify(resultJson));
                resultJson.issues.forEach(function (res) {
                    issues.push({
                        key: res.key,
                        viewers: res.fields.customfield_10000,
                        requestors: res.fields.customfield_10001
                    });
                });
                var select = document.getElementById("selectIssue");
                var options = issues;

                for (var i = 0; i < options.length; i++) {
                    var opt = options[i];
                    var el = document.createElement("option");
                    el.textContent = opt.key;
                    el.value = opt.key;
                    select.appendChild(el);
                }

            }
        });
};

function getIssueDetails() {
    viewers.length = 0;
    requestors.length = 0;
    issueKey = document.getElementById('selectIssue').value;
    fetch("/jira/rest/api/2/issue/" + issueKey)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                return undefined;
            }
        })
        .then(function (resultJson) {
            if (resultJson !== undefined) {
                //console.log("Issue details here: " + JSON.stringify(resultJson));
                resultJson.fields.customfield_10000.forEach(function (res) {
                    viewers.push({
                        name: res.name
                    })
                });
                resultJson.fields.customfield_10001.forEach(function (res) {
                    requestors.push({
                        name: res.name
                    })
                })
                // console.log("Viewers here: " + JSON.stringify(viewers) +
                //     "Requestors here: " + JSON.stringify(requestors));
                appendIssueDetails(viewers, requestors);
            }
        });

}

//
function appendIssueDetails(viewers, requestors) {
    //console.log("Within appendIssues function: " + issues.length);
    var viewersTable = document.getElementById("issueViewersTable");
    var requestorsTable = document.getElementById("issueRequestorsTable");
    // Clear the table from previous issues - anything but the header row
    for (var i = viewersTable.rows.length - 1; i > 0; i--) {
        viewersTable.deleteRow(i);
    };
    for (var i = requestorsTable.rows.length - 1; i > 0; i--) {
        requestorsTable.deleteRow(i);
    };
    //console.log("Viewers here: " + JSON.stringify(viewers));
    //console.log("Requestors here: " + JSON.stringify(requestors));

    viewers.forEach(function (object) {
        //console.log("Within foreach:" + object.name);
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:left'>" + object.name + "</td>" +
            "<td style='text-align:center'><button>Remove</button></td>";
        viewersTable.appendChild(tr);
    });
    requestors.forEach(function (object) {
        //console.log("Within foreach:" + object.name);
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:left'>" + object.name + "</td>" +
            "<td style='text-align:center'><button onclick='acceptRequestor()'>Accept</button></td>" +
            "<td style='text-align:center'><button>Reject</button></td>";
        requestorsTable.appendChild(tr);
    });
}

/**
 * This function checks if the issue Due Date has passed.
 * @params dueDate, resolutionDate of the issue
 * returns true if due date comes after resolution date
 */

function checkDueDate(dueDate, resolutionDate) {
    var issueDueDate = new Date(dueDate);
    var issueResolutionDate = new Date(resolutionDate);
    //console.log(issueDueDate > issueResolutionDate);
    return (issueDueDate > issueResolutionDate);
}

getLoggedInUser();
//getProjects();
//getIssuesOfUser();