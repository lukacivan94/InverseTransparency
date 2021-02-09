/**
 * @file
 * Functionality used by all plugins.
 */

// ------------------- Variables -----------------

const users = [];
const usersOfProject = [];
const uniqueProjectUsers = [];
const projects = [];
const issuesOfUser = [];
const issuesOfProject = [];
const commentsOfProjectIssues = [];
const usersWithProjectRoles = [];

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

function getIssuesOfProject() {
    issuesOfProject.length = 0;
    usersWithProjectRoles.length = 0;
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

                appendIssues(issuesOfProject);
                getUsersOfProject();
                //getRoles();
                console.log("There are " + issuesOfProject.length + " issues of " + currentProject + " project: " + JSON.stringify(issuesOfProject));
            }
        });
}

function buildIssues(res, issues) {
    // we only consider assigned issues
    if (res.fields.assignee !== null) {
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
    } else {
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
                    assignee: "Unassigned",
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
                    assignee: "Unassigned",
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
                    assignee: "Unassigned",
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
                    assignee: "Unassigned",
                    created: res.fields.created,
                    priority: res.fields.priority.name,
                    category: "red",
                });
            }
        }
    }
}

function getCommentsOfIssue(issue) {
    commentsOfProjectIssues.length = 0;
    fetch("/jira/rest/api/2/issue/" + issue.key + "/comment")
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
                console.log("COMMENTS ARE HERE: " + JSON.stringify(resultJson));
                if (resultJson.total > 0) { //if an issue has at least one comment
                    resultJson.comments.forEach(function (comment) {
                        commentsOfProjectIssues.push({
                            author: comment.author.name,
                            body: comment.body
                        })
                    })
                }
                console.log("Users with comments: " + JSON.stringify(commentsOfProjectIssues));
            }
        });
}

// api token: KLUiCLiGSE5byvjA6fB88B89
function getRolesOfProject() {
    fetch("/jira/rest/api/2/project/" + currentProject + "/role")
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
            }
        });
}


function getUsersWithProjectRoles(roleId) {
    fetch("/jira/rest/api/2/project/" + currentProject + "/role/" + roleId)
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
                console.log("ROLES ARE HERE: " + JSON.stringify(resultJson));
                if (resultJson.actors.length > 0) { //if a project has at least one actor
                    resultJson.actors.forEach(function (actor) {
                        usersWithProjectRoles.push({
                            name: actor.name,
                            role: resultJson.name
                        })
                    })
                    //console.log("Users with roles: " + JSON.stringify(usersWithProjectRoles));
                }
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


// ------------------- Function calls -----------------

// getUsers();
// getProjects();