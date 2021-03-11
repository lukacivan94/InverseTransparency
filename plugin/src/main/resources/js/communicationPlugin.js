/**
 * @file
 * Functionality of the Communication overview dashboard plugin.
 */

// ------------------- Variables -----------------
const rolesWithCommentNumbers = [];

// ------------------- Functions -----------------



//TODO uncomment appendIssues function call in common.js
function appendIssues(issues) {
    $.ajax({
        url: getCommentsOfProject(issues),
        success: function () {
            groupCommentsPerRoles();
        }
    });
    $.ajax({
        url: groupCommentsPerRoles(),
        success: function () {
            buildChart();
        }
    });
}

function getCommentsOfProject(issues) {
    commentsOfProjectIssues.length = 0;
    issues.forEach(function (issue) {
        getCommentsOfIssue(issue);
    });
}

function getCommentsOfIssue(issue) {
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

function groupCommentsPerRoles() {
    rolesWithCommentNumbers.length = 0;
    console.log('comments of project: ' + JSON.stringify(commentsOfProjectIssues));
    var numberOfDevelopersComments = 0;
    var numberOfTestersComments = 0;
    var numberOfViewersComments = 0;
    var numberOfProjectAdminsComments = 0;
    if (commentsOfProjectIssues.length < 1) {
        rolesWithCommentNumbers.push({
            role: "No comments for this project",
            numberOfComments: 0
        })
    } else {
        developers.forEach(function (user) {
            if (user.projectId == currentProject) {
                commentsOfProjectIssues.forEach(function (comment) {
                    if (user.name == comment.author) {
                        numberOfDevelopersComments++;
                    }
                })
            }
        })
        testers.forEach(function (user) {
            if (user.projectId == currentProject) {
                commentsOfProjectIssues.forEach(function (comment) {
                    if (user.name == comment.author) {
                        numberOfTestersComments++;
                    }
                })
            }
        })
        viewers.forEach(function (user) {
            if (user.projectId == currentProject) {
                commentsOfProjectIssues.forEach(function (comment) {
                    if (user.name == comment.author) {
                        numberOfViewersComments++;
                    }
                })
            }
        })
        projectAdmins.forEach(function (user) {
            if (user.projectId == currentProject) {
                commentsOfProjectIssues.forEach(function (comment) {
                    if (user.name == comment.author) {
                        numberOfProjectAdminsComments++;
                    }
                })
            }
        })
        var totalNumberOfcomments = numberOfDevelopersComments+numberOfTestersComments+numberOfViewersComments+numberOfProjectAdminsComments;
        rolesWithCommentNumbers.push({
            role: "Developers", numberOfComments: numberOfDevelopersComments/totalNumberOfcomments, color: 'color: #e4ff8a'
        })
        rolesWithCommentNumbers.push({
            role: "Testers", numberOfComments: numberOfTestersComments/totalNumberOfcomments, color: 'color: #8aeaff'
        })
        rolesWithCommentNumbers.push({
            role: "Viewers", numberOfComments: numberOfViewersComments/totalNumberOfcomments, color: 'color: #ffea8a'
        })
        rolesWithCommentNumbers.push({
            role: "Project Administrators", numberOfComments: numberOfProjectAdminsComments/totalNumberOfcomments, color: 'color: #f59b47'
        })
    }
}

function buildChart() {
    google.charts.load('current', { packages: ['corechart', 'bar'] });
    google.charts.setOnLoadCallback(drawMultSeries);

    function drawMultSeries() {
        const data = new google.visualization.DataTable();

        data.addColumn('string', 'Role');
        data.addColumn('number', 'Comments');
        data.addColumn({type:'string', role:'style'}); //needs to be after the values column

        rolesWithCommentNumbers.forEach(function (role) {
            data.addRows([
                [role.role, role.numberOfComments, role.color]
            ]);
        })

        var options = {
            title: 'Comments per role',
            legend: {position: 'none'},
            width: "620",
            height: "400",
            hAxis: {
                title: 'Role',
            },
            vAxis: {
                title: 'Number of comments', format:'#%'
            },
            
        };

        var chart = new google.visualization.ColumnChart(
            document.getElementById('chart_div'));

        chart.draw(data, options);
    }
}

// uniqueProjectUsers array has already been populated with the getProjects function call
// and can be used here
function appendUsers() {
    queryRequest(uniqueProjectUsers);
}

function switchViews(){
    $("#hoverMessage").hide();
}

// ------------------- Function calls -----------------

getProjects();
displayNotice();
switchViews();












// ------------------- OLD CODE ABANDONED, API USED INSTEAD -----------------

// const users = [];
// var currentUser;
// const issues = [];
// const viewers = [];
// const requestors = [];


// function acceptRequestor() {
//     console.log("acceptRequestor method called");
//     var formData = {
//         "update": {
//             "customfield_10000": [{ "add": { "name": "Stefan" } }]
//         }
//     }

//     var fetchBody = {
//         method: "PUT",
//         headers: {
//             Authorization: "Basic " + btoa("admin:admin"),
//             "Content-Type": "application/json"
//         },
//         body: {
//             "update": {
//                 "customfield_10000": [{ "add": { "name": "Stefan" } }]
//             }
//         }
//     };
//     fetch("/jira/rest/api/2/issue/TP-3/editmeta")
//         .then(function (response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 console.error("JIRA API call failed");
//                 console.log("[ERROR]: " + response.json())
//                 return undefined;
//             }
//         }).then(function (resultJson) {
//             if (resultJson !== undefined) {
//                 console.log("Answer: " + JSON.stringify(resultJson));
//             }
//         });
//     fetch("/jira/rest/api/2/issue/TP-3", fetchBody)
//         .then(function (response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 console.error("JIRA API call failed");
//                 return undefined;
//             }
//         }).then(function (resultJson) {
//             if (resultJson !== undefined) {
//                 console.log("Answer: " + JSON.stringify(resultJson));
//             }
//         });
// };


// /**
//  * This function gets the name of the logged in user and  stores it in current user
//  */
// function getLoggedInUser() {
//     fetch("/jira/rest/auth/latest/session")
//         .then(function (response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 console.error("JIRA API call failed");
//                 return undefined;
//             }
//         })
//         .then(function (resultJson) {
//             if (resultJson !== undefined) {
//                 currentUser = resultJson.name
//                 console.log("Logged in user is: " + currentUser);
//                 getIssuesOfUser(currentUser);
//             }
//         });
// };

// /**
//  * This function gets all issues from the user and stores them in issues.
//  */
// function getIssuesOfUser(user) {
//     console.log("Current user is: " + user);
//     fetch("/jira/rest/api/2/search?jql=assignee=" + user)
//         .then(function (response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 console.error("JIRA API call failed");
//                 return undefined;
//             }
//         })
//         .then(function (resultJson) {
//             if (resultJson !== undefined) {
//                 //console.log("Issues here: " + JSON.stringify(resultJson));
//                 resultJson.issues.forEach(function (res) {
//                     issues.push({
//                         key: res.key,
//                         viewers: res.fields.customfield_10000,
//                         requestors: res.fields.customfield_10001
//                     });
//                 });
//                 var select = document.getElementById("selectIssue");
//                 var options = issues;

//                 for (var i = 0; i < options.length; i++) {
//                     var opt = options[i];
//                     var el = document.createElement("option");
//                     el.textContent = opt.key;
//                     el.value = opt.key;
//                     select.appendChild(el);
//                 }

//             }
//         });
// };

// function getIssueDetails() {
//     viewers.length = 0;
//     requestors.length = 0;
//     issueKey = document.getElementById('selectIssue').value;
//     fetch("/jira/rest/api/2/issue/" + issueKey)
//         .then(function (response) {
//             if (response.ok) {
//                 return response.json();
//             } else {
//                 console.error("JIRA API call failed");
//                 return undefined;
//             }
//         })
//         .then(function (resultJson) {
//             if (resultJson !== undefined) {
//                 //console.log("Issue details here: " + JSON.stringify(resultJson));
//                 resultJson.fields.customfield_10000.forEach(function (res) {
//                     viewers.push({
//                         name: res.name
//                     })
//                 });
//                 resultJson.fields.customfield_10001.forEach(function (res) {
//                     requestors.push({
//                         name: res.name
//                     })
//                 })
//                 // console.log("Viewers here: " + JSON.stringify(viewers) +
//                 //     "Requestors here: " + JSON.stringify(requestors));
//                 appendIssueDetails(viewers, requestors);
//             }
//         });

// }

// //
// function appendIssueDetails(viewers, requestors) {
//     //console.log("Within appendIssues function: " + issues.length);
//     var viewersTable = document.getElementById("issueViewersTable");
//     var requestorsTable = document.getElementById("issueRequestorsTable");
//     // Clear the table from previous issues - anything but the header row
//     for (var i = viewersTable.rows.length - 1; i > 0; i--) {
//         viewersTable.deleteRow(i);
//     };
//     for (var i = requestorsTable.rows.length - 1; i > 0; i--) {
//         requestorsTable.deleteRow(i);
//     };
//     //console.log("Viewers here: " + JSON.stringify(viewers));
//     //console.log("Requestors here: " + JSON.stringify(requestors));

//     viewers.forEach(function (object) {
//         //console.log("Within foreach:" + object.name);
//         var tr = document.createElement("tr");

//         tr.innerHTML = "<td style='text-align:left'>" + object.name + "</td>" +
//             "<td style='text-align:center'><button>Remove</button></td>";
//         viewersTable.appendChild(tr);
//     });
//     requestors.forEach(function (object) {
//         //console.log("Within foreach:" + object.name);
//         var tr = document.createElement("tr");

//         tr.innerHTML = "<td style='text-align:left'>" + object.name + "</td>" +
//             "<td style='text-align:center'><button onclick='acceptRequestor()'>Accept</button></td>" +
//             "<td style='text-align:center'><button>Reject</button></td>";
//         requestorsTable.appendChild(tr);
//     });
// }

// /**
//  * This function checks if the issue Due Date has passed.
//  * @params dueDate, resolutionDate of the issue
//  * returns true if due date comes after resolution date
//  */

// function checkDueDate(dueDate, resolutionDate) {
//     var issueDueDate = new Date(dueDate);
//     var issueResolutionDate = new Date(resolutionDate);
//     //console.log(issueDueDate > issueResolutionDate);
//     return (issueDueDate > issueResolutionDate);
// }

// getLoggedInUser();
// //getProjects();
// //getIssuesOfUser();