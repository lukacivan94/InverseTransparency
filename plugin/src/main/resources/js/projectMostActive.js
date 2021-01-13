/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------

const projects = [];
var currentProject;
const users = [];
const usersOfProjectIssues = [];
var currentUser;
const issues = [];

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
                console.log("All users: " + JSON.stringify(resultJson));
                console.log("Users: " + JSON.stringify(users));
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

function getIssuesOfProject() {
    issues.length = 0;
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
                                category: "green"
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
                                category: "red"
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
                                category: "green"
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
                                category: "red"
                            });
                        }
                    }
                })
                getUsersOfProjectIssues(issues);
                console.log("These are the issues of " + currentProject + " project: " + JSON.stringify(issues));
            }
        });
}

function getUsersOfProjectIssues(issues) {
    for (i = 0; i < issues.length; i++) {
        if (!usersOfProjectIssues.includes(issues[i].assignee)) {
            usersOfProjectIssues.push(issues[i].assignee);
        } else {
            return;
        }
    }
    console.log("Users of Project issues: " + usersOfProjectIssues);
    return usersOfProjectIssues;
}

//provide a list of users 
function appendUsers(users) {
    //console.log("Within appendIssues function: " + issues.length);
    var table = document.getElementById("projectUsersTable");

    // Clear the table from previous users - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };

    users.forEach(function (object) {
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

function getUsersOfProject() {

}

getProjects();