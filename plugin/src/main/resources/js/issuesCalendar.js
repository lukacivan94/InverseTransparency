/**
 * @file
 * Functionality of the issues calendar dashboard plugin.
 */

// ------------------- Variables -----------------

var projects;
var currentProject;
const users = [];
var currentUser;
const issues = [];
const visibleIssues = [];

/**
 * This function returns a list of all users and saves them in users. 
 */
function getUsers() {
    fetch("/jira/rest/api/2/user/search?username=.&maxResults=2000")
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
                resultJson.forEach(function (res) {
                    users.push({
                        name: res.name,
                        key: res.key,
                        fullname: res.displayName
                    });
                });
                var select = document.getElementById("selectUser");
                var options = users;

                for (var i = 0; i < options.length; i++) {
                    var opt = options[i];
                    var el = document.createElement("option");
                    el.textContent = opt.fullname;
                    el.value = opt.key;
                    select.appendChild(el);
                }
                //console.log("All users: " + JSON.stringify(resultJson));
                //console.log("Users: " + JSON.stringify(users));
            }
        });

}

function appendIssues(issues) {
    //console.log("Within appendIssues function: " + issues.length);
    var table = document.getElementById("userIssuesTable");

    // Clear the table from previous issues - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };

    issues.forEach(function (object) {
        //console.log("Within foreach:" + object.key);
        var tr = document.createElement("tr");
        if (object.category == "red") {
            tr.innerHTML = "<td style='text-align:center'>" + object.key + "</td>" +
                "<td style='text-align:center'>" + object.duedate + "</td>" +
                "<td style='text-align:center; background-color:#FF6A4B'>" + object.category + "</td>";
        } else {
            tr.innerHTML = "<td style='text-align:center'>" + object.key + "</td>" +
                "<td style='text-align:center'>" + object.duedate + "</td>" +
                "<td style='text-align:center; background-color:#DBFFAB'>" + object.category + "</td>";
        }

        table.appendChild(tr);
    });
    //document.body.appendChild(table);
}

/**
 * This function gets all issues from the user and stores them in issues.
 * @param {String} user name of the user
 */
function getIssuesOfUser() {
    issues.length = 0;
    currentUser = document.getElementById('selectUser').value;
    console.log("Current user is: " + currentUser);
    fetch("/jira/rest/api/2/search?jql=assignee=" + currentUser)
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
                resultJson.issues.forEach(function (res) {
                    if (res.fields.resolution !== null) {
                        if (checkDueDate(res.fields.duedate, res.fields.resolutiondate)) {
                            issues.push({
                                key: res.key,
                                issueType: res.fields.issuetype.name,
                                summary: res.fields.summary,
                                project: res.fields.project.key,
                                duedate: res.fields.duedate,
                                resolution: res.fields.resolution.name, //taking name if not null
                                resolutiondate: res.fields.resolutiondate,
                                assignee: res.fields.assignee.name,
                                category: "green",
                                visible: false
                            });
                        } else {
                            issues.push({
                                key: res.key,
                                issueType: res.fields.issuetype.name,
                                summary: res.fields.summary,
                                project: res.fields.project.key,
                                duedate: res.fields.duedate,
                                resolution: res.fields.resolution.name, //taking name if not null
                                resolutiondate: res.fields.resolutiondate,
                                assignee: res.fields.assignee.name,
                                category: "red",
                                visible: false
                            });
                        }
                    } else { //since unresolved issues don't have resolution date we forward current date
                        if (checkDueDate(res.fields.duedate, new Date())) {
                            issues.push({
                                key: res.key,
                                issueType: res.fields.issuetype.name,
                                summary: res.fields.summary,
                                project: res.fields.project.key,
                                duedate: res.fields.duedate,
                                resolution: res.fields.resolution, //just taking null
                                resolutiondate: res.fields.resolutiondate,
                                assignee: res.fields.assignee.name,
                                category: "green",
                                visible: false
                            });
                        } else {
                            issues.push({
                                key: res.key,
                                issueType: res.fields.issuetype.name,
                                summary: res.fields.summary,
                                project: res.fields.project.key,
                                duedate: res.fields.duedate,
                                resolution: res.fields.resolution, //just taking null
                                resolutiondate: res.fields.resolutiondate,
                                assignee: res.fields.assignee.name,
                                category: "red",
                                visible: false
                            });
                        }
                    }
                });
                console.log("There are " + issues.length + " issues: " + JSON.stringify(issues));
                buildCalendar(issues);
            }
        });

};

/**
 * This function checks if the issue Due Date has passed.
 * @param {String} date due date of the issue
 * returns true if due date comes after resolution date
 */
function checkDueDate(dueDate, resolutionDate) {
    var issueDueDate = new Date(dueDate);
    var issueResolutionDate = new Date(resolutionDate);
    //console.log(issueDueDate > issueResolutionDate);
    return (issueDueDate > issueResolutionDate);
}

/**
 * This function builds the Calendar and displays issues of the selected user
 */
function buildCalendar(issues) {
    //document.addEventListener('DOMContentLoaded', function () {//});
    var calendarEl = document.getElementById('calendar');

    var events = issues.map(issue => {
        return {
            title: issue.key,
            start: issue.duedate,
            color: issue.category
        }
    })

    console.log("Issues within buildCalendar: " + JSON.stringify(issues));

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: '2021-01-07',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        eventClick: function (info) {
            requestView(info)
        },
        eventMouseEnter: function (mouseEnterInfo) {
            displayHoverMessage(mouseEnterInfo)
        }
    });

    calendar.render();

    console.log("Calendar has been built");
}

function requestView(info) {

    visibleIssues.push(({
        key: "SP-2",
        visible: true
    }))
    if (checkIfVisible(info.event.title)) {
        displayVisibleIssue(info.event.title);
    } else {
        console.log("View has been requested for issue: " + info.event.title);
        alert("View has been requested for issue: " + info.event.title);

        // change the border color just for fun
        info.el.style.borderColor = 'red';
    }
}

function displayHoverMessage() {
    console.log("Hover message is displaying");
}

function checkIfVisible(issueKey) {
    var i;
    for (i = 0; i < visibleIssues.length; i++) {
        if (visibleIssues[i].key === issueKey) {
            return true;
        }
    }
    return false;
}

function displayVisibleIssue(issueKey) {
    console.log("Here is the " + issueKey + " details:");
}

getUsers();
//getProjects();
getIssuesOfUser();
