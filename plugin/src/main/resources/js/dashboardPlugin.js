/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------

var projects;
var currentProject;
const users = [];
var currentUser;
const currentUsers = [];
const issues = [];
const viewers = [];
const requestors = [];

/**
 * This function gets all issues from the user and stores them in issues.
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
                currentUsers.push({ //put back to current user
                    name: resultJson.name
                })
                console.log("Logged in user is: " + currentUsers[0].name);
                getIssuesOfUser(currentUsers);
            }
        });
};

/**
 * This function gets all issues from the user and stores them in issues.
 */
function getIssuesOfUser(users) {
    console.log("Current user is: " + users[0].name);
    fetch("/jira/rest/api/2/search?jql=assignee=" + users[0].name)
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
                console.log("Issues here: " + JSON.stringify(resultJson));
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
                console.log("Issue details here: " + JSON.stringify(resultJson));
                resultJson.fields.customfield_10000.forEach(function (res) {
                    viewers.push({
                        name: res.name
                    })
                })
                console.log("Viewers here: " + JSON.stringify(viewers));

            }
        });
    appendIssueDetails(viewers);
}

//
function appendIssueDetails(viewers) {
    //console.log("Within appendIssues function: " + issues.length);
    var table = document.getElementById("userIssueTable");

    // Clear the table from previous issues - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };
    console.log("Viewers here: " + JSON.stringify(viewers));

    viewers.forEach(function (object) {
        //console.log("Within foreach:" + object.key);
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:center'>" + object.name + "</td>" +
            "<td style='text-align:center'>" + object.name + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + object.name + "</td>";


        table.appendChild(tr);
    });
    //document.body.appendChild(table);
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