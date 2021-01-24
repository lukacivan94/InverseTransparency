/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------

// JIRA queries
// project = TP AND resolution = Unresolved AND assignee in (ivan)
//http://localhost:2990/jira/browse/SP-1?jql=resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(ivan)%20ORDER%20BY%20priority%20DESC%2C%20updated%20DESC
///rest/api/2/user/search?username=.&startAt=0&maxResults=2000
///rest/api/2/search?jql=assignee=currentuser()

const projects = [];
var currentProject;
const users = [];
const usersOfProject = [];
const uniqueProjectUsers = [];
var currentUser;
const issuesOfUser = [];
const issuesOfProject = [];

/**
 * This function returns a list of all users and saves them in users array. 
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


/**
 * This function gets all projects and stores them in projects.
 * The key of the first one gets stored in currentProject.
 */
function getProjects() {
    fetch("/jira/rest/api/2/project")
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
                    projects.push({
                        self: res.self,
                        id: res.id,
                        key: res.key,
                        name: res.name
                    });
                });
                var select = document.getElementById("selectProject");
                var options = projects;

                for (var i = 0; i < options.length; i++) {
                    var opt = options[i];
                    var el = document.createElement("option");
                    el.textContent = opt.name;
                    el.value = opt.key;
                    select.appendChild(el);
                }
            }
        });
};

// The assumption is that every issue has Assignee
// otherwise null pointer error pops up
function getIssuesOfProject() {
    issuesOfProject.length = 0;
    currentProject = document.getElementById('selectProject').value;
    console.log("Current project is: " + currentProject);
    fetch("/jira/rest/api/2/search?jql=project=" + currentProject)
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
                    buildIssues(res, issuesOfProject);
                })
                getUsersOfProject();
                console.log("There are " + issuesOfProject.length + " issues of " + currentProject + " project: " + JSON.stringify(issuesOfProject));
            }
        });
}


/*  i.e.
    SP-1: admin,
    SP-2: valentin,
    SP-3: ivan,
    SP-4: valentin
    usersOfProject = [admin, valentin, ivan]
*/
function getUsersOfProject() {
    usersOfProject.length = 0; //clearing previous project users
    issuesOfProject.forEach(function (issue) {
        usersOfProject.push(
            issue.assignee
        )
    })
    uniqueProjectUsers.length = 0; //clearing previous project users
    //clearing duplicates
    $.each(usersOfProject, function (i, el) {
        if ($.inArray(el, uniqueProjectUsers) === -1) uniqueProjectUsers.push(el);
    });
    console.log("Users of project: " + JSON.stringify(usersOfProject));
    console.log("Unique Users of project: " + JSON.stringify(uniqueProjectUsers));
    appendUsers();
}

//provide a list of users 
function appendUsers() {
    console.log("Within appendUsers function: " + uniqueProjectUsers.length);
    var table = document.getElementById("projectUsersTable");

    // Clear the table from previous users - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };
    uniqueProjectUsers.forEach(function (user) {
        var sortedIssues = sortUserIssues(user);
        console.log("[ISSUES]: " + JSON.stringify(sortedIssues));
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:center'>" + user + "</td>" +
            "<td style='text-align:center; background-color:#DBFFAB''>" + sortedIssues.numberOfGreenIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.numberOfRedIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.successRate + "</td>";
        table.appendChild(tr);
    });
}

function sortUserIssues(user) {
    var numberOfRedIssues = 0;
    var numberOfGreenIssues = 0;
    for (let i = 0; i < issuesOfProject.length; i++) {
        if (issuesOfProject[i].assignee == user) {
            if (issuesOfProject[i].category == "red") {
                numberOfRedIssues++;
            } else {
                numberOfGreenIssues++;
            }
        }
    }
    var totalIssues = numberOfGreenIssues + numberOfRedIssues;
    var successRate = Math.round(numberOfGreenIssues / totalIssues * 100) + "%";
    console.log("[SUCCESS RATE]: " + successRate);
    return {
        user: user,
        numberOfRedIssues: numberOfRedIssues,
        numberOfGreenIssues: numberOfGreenIssues,
        successRate: successRate
    };
}

/**
 * This function gets all issues from the user and stores them in issues.
 */
function getIssuesOfUser() {
    issuesOfUser.length = 0;
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
                console.log("[ISSUES]: " + JSON.stringify(resultJson));
                resultJson.issues.forEach(function (res){
                    buildIssues(res, issuesOfUser);
                });
                console.log("There are " + issuesOfUser.length + " issues: " + JSON.stringify(issuesOfUser));
                appendIssues(issuesOfUser);
                
            }
        });
};

function buildIssues(res, issues) {
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
                //viewers: res.fields.customfield_10000,
                //requestors: res.fields.customfield_10001
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
                //viewers: res.fields.customfield_10000,
                //requestors: res.fields.customfield_10001
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
                //viewers: res.fields.customfield_10000,
                //requestors: res.fields.customfield_10001
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
                //viewers: res.fields.customfield_10000,
                //requestors: res.fields.customfield_10001
            });
        }
    }
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

function switchViews() {
    $("#calendarView").hide();
    $("#projectView").hide();
    $("#selectProjectDiv").hide();
    $('#viewSelector').on('click', 'a', function () {
        if ($(this).hasClass("calendarView")) {
            $("#listView").hide();
            $("#calendarView").show();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('<a href="#" class="listView">list view</a> | calendar view | <a href="#" class="projectView">project view</a>');
            buildCalendar(issuesOfUser);
        }
        if ($(this).hasClass("listView")) {
            $("#listView").show();
            $("#calendarView").hide();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('list view | <a href="#" class="calendarView">calendar view</a> | <a href="#" class="projectView">project view</a>');
        }
        if ($(this).hasClass("projectView")) {
            $("#listView").hide();
            $("#calendarView").hide();
            $("#projectView").show();
            $("#selectUserDiv").hide();
            $("#selectProjectDiv").show();
            $("#viewSelector").html('<a href="#" class="listView">list view</a> | <a href="#" class="calendarView">calendar view</a> | project view');
        }
        return false;
    });
}

switchViews();
getUsers();
getProjects();
//getIssuesOfUser("valentin");