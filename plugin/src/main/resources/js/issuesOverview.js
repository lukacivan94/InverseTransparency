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

var projects;
var currentProject;
/** Array of users {name: string, issues: number, priority: Array [numbers], type: Array [numbers]} */
const users = [];
var currentUser;
const issues = [];
var dropdown;
var defaultOption;
/**
 * This function gets called by the submit button to change the current user and update the plugin.
 */
function changeUser() {
    currentUser = $('#user').val();
    //getIssues(true);
}

// function getUsersDropdown() {
//     //getUsers();
//     dropdown = document.getElementById('locality-dropdown');
//     dropdown.length = 0;

//     defaultOption = document.createElement('option');
//     defaultOption.text = 'Select user';

//     dropdown.add(defaultOption);
//     dropdown.selectedIndex = 0;

//     const url = '"/jira/rest/api/2/user/search?username=.&maxResults=2000"';

//     fetch(url)
//         .then(
//             function (response) {
//                 if (response.status !== 200) {
//                     console.warn('Looks like there was a problem. Status Code: ' +
//                         response.status);
//                     return;
//                 }

//                 // Examine the text in the response  
//                 response.json().then(function (data) {
//                     var option;

//                     for (var i = 0; i < data.length; i++) {
//                         option = document.createElement('option');
//                         option.text = data[i].name;
//                         option.value = data[i].key;
//                         dropdown.add(option);
//                     }
//                 });
//             }
//         )
//         .catch(function (err) {
//             console.error('Fetch Error -', err);
//         });
// }

/**
 * This function gets a list of all users and saves them in users. 
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
                projects = resultJson;
                currentProject = projects[0].key;
                console.log("Current project: " + currentProject);
                console.log("All projects: " + JSON.stringify(projects));
            }
        });
};

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
                });
                console.log("There are " + issues.length + " issues: " + JSON.stringify(issues));
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

getUsers();
//getProjects();
//getIssuesOfUser("valentin");