/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------

const projects = [];
var currentProject;
const users = [];
const usersOfProjectIssues = [];
const uniqueProjectUsers = [];
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


// The assumption is that every issue has Assignee
// otherwise null pointer error pops up
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
                getUsersOfProjectIssues();
                console.log("There are " + issues.length + " issues of " + currentProject + " project: " + JSON.stringify(issues));
            }
        });
}

/*  i.e.
    SP-1: admin,
    SP-2: valentin,
    SP-3: ivan,
    SP-4: valentin
    usersOfProjectIssues = [admin, valentin, ivan]
*/
function getUsersOfProjectIssues() {
    usersOfProjectIssues.length = 0; //clearing earlier project users
    issues.forEach(function (issue) {
        usersOfProjectIssues.push(
            issue.assignee
        )
    })
    uniqueProjectUsers.length = 0; //clearing earlier project users
    //clearing duplicates
    $.each(usersOfProjectIssues, function (i, el) {
        if ($.inArray(el, uniqueProjectUsers) === -1) uniqueProjectUsers.push(el);
    });
    console.log("Users of project: " + JSON.stringify(usersOfProjectIssues));
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
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.numberOfRedIssues + "</td>";
        ;

        table.appendChild(tr);
    });
}

function sortUserIssues(user) {
    //var sortedIssues = [];
    var numberOfRedIssues = 0;
    var numberOfGreenIssues = 0;
    for (let i = 0; i < issues.length; i++) {
        if (issues[i].assignee == user) {
            if (issues[i].category == "red") {
                numberOfRedIssues++;
            } else {
                numberOfGreenIssues++;
            }
        }
    }
    // sortedIssues.push({
        
    // })
    return {
        user: user,
        numberOfRedIssues: numberOfRedIssues,
        numberOfGreenIssues: numberOfGreenIssues
    };
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
//getUsers();