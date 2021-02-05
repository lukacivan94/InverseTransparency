/**
 * @file
 * Functionality used by all plugins.
 */

// ------------------- Variables -----------------

const users = [];
const projects = [];
const issuesOfUser = [];
const issuesOfProject = [];

var currentUser;
var currentProject;

// ------------------- Functions -----------------

/**
 * This function returns a list of all users and saves them in users array. 
 * It populates the User Select
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
            }
        });
}

/**
 * This function gets all projects and stores them in projects.
 * It populates the Project Select
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
                resultJson.issues.forEach(function (res) {
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
                created: res.fields.created,
                priority: res.fields.priority.name,
                category: "green",
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
                created: res.fields.created,
                priority: res.fields.priority.name,
                category: "red",
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
                created: res.fields.created,
                priority: res.fields.priority.name,
                category: "green",
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
                created: res.fields.created,
                priority: res.fields.priority.name,
                category: "red",
            });
        }
    }
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

// ------------------- Function calls -----------------

getUsers();
getProjects();