/**
 * @file
 * Functionality of the Communication overview dashboard plugin.
 */

// ------------------- Variables -----------------
const rolesWithCommentNumbers = [];

// ------------------- Functions -----------------

/**
 * This function syncs function calls
 * */
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

/**
 * This function calls getCommentsOfIssue(issue);
 * */
function getCommentsOfProject(issues) {
    commentsOfProjectIssues.length = 0;
    issues.forEach(function (issue) {
        getCommentsOfIssue(issue);
    });
}

/**
 * This function retrieves comments from the JIRA API
 * */
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

/**
 * This function groups the comments per roles
 * */
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
        var totalNumberOfcomments = numberOfDevelopersComments + numberOfTestersComments + numberOfViewersComments + numberOfProjectAdminsComments;
        rolesWithCommentNumbers.push({
            role: "Developers", numberOfComments: numberOfDevelopersComments / totalNumberOfcomments, color: 'color: #e4ff8a'
        })
        rolesWithCommentNumbers.push({
            role: "Testers", numberOfComments: numberOfTestersComments / totalNumberOfcomments, color: 'color: #8aeaff'
        })
        rolesWithCommentNumbers.push({
            role: "Viewers", numberOfComments: numberOfViewersComments / totalNumberOfcomments, color: 'color: #ffea8a'
        })
        rolesWithCommentNumbers.push({
            role: "Project Administrators", numberOfComments: numberOfProjectAdminsComments / totalNumberOfcomments, color: 'color: #f59b47'
        })
    }
}

/**
 * This function builds the chart
 * */
function buildChart() {
    google.charts.load('current', { packages: ['corechart', 'bar'] });
    google.charts.setOnLoadCallback(drawMultSeries);

    function drawMultSeries() {
        const data = new google.visualization.DataTable();

        data.addColumn('string', 'Role');
        data.addColumn('number', 'Comments');
        data.addColumn({ type: 'string', role: 'style' }); //needs to be after the values column

        rolesWithCommentNumbers.forEach(function (role) {
            data.addRows([
                [role.role, role.numberOfComments, role.color]
            ]);
        })

        var options = {
            title: 'Comments per role',
            legend: { position: 'none' },
            width: "620",
            height: "400",
            hAxis: {
                title: 'Role',
            },
            vAxis: {
                title: 'Number of comments', format: '#%',
                ticks: [0.15,0.3]
            },

        };

        var chart = new google.visualization.ColumnChart(
            document.getElementById('chart_div'));

        chart.draw(data, options);
    }
}

/**
 * This function  triggers a queryRequest function and populates the GUI with data
 * */
function appendUsers() {
    queryRequest(uniqueProjectUsers);
    $.ajax({
        url: queryRequest(uniqueProjectUsers),
        success: function () {
            checkKAnonymity();
        }
    });
}

/**
 * This function checks if k-anonymity applies
 * */
function checkKAnonymity() {

    var numberOfDevs = 0;
    developers.forEach(function (developer) {
        if (developer.projectId == currentProject) {
            numberOfDevs++;
        }
    })
    if (numberOfDevs >= 2) {
        $("#hoverMessageProject").hide();
    }
}

/**
 * This function hides the data when it is restricted by the user
 * */
function switchViews() {
    $("#hoverMessageProject").show();
}

// ------------------- Function calls -----------------

getProjects();
displayNotice();
switchViews();
checkKAnonymity();