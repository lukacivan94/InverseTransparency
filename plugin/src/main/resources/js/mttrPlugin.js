/**
 * @file
 * Functionality used by MTTR plugin.
 */

// ------------------- Variables -----------------

const issuesByPriority = [];
const lowestIssues = [];
const lowIssues = [];
const mediumIssues = [];
const highIssues = [];
const highestIssues = [];

// ------------------- Functions -----------------

/**
 * This function switches between the views of the MTTR plugin
 * */
function switchViews() {
    $("#hoverMessage").show();
    $("#hoverMessageProject").hide();
    $("#projectView").hide();
    $("#selectProjectDiv").hide();
    $('#viewSelector').on('click', 'a', function () {
        if ($(this).hasClass("userView")) {
            $("#userView").show();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('user view | <a href="#" class="projectView">project view</a>');
            $("#hoverMessageProject").hide();
            $("#hoverMessage").show();
            appendIssues(issuesOfUser);
        }
        if ($(this).hasClass("projectView")) {
            $("#userView").hide();
            $("#projectView").show();
            $("#selectUserDiv").hide();
            $("#selectProjectDiv").show();
            $("#viewSelector").html('<a href="#" class="userView">user view</a> | project view');
            $("#hoverMessageProject").show();
            $("#hoverMessage").show();///////////////
            //appendUsers();
        }
        return false;
    });
}

/**
 * This function  triggers a directRequest function and populates the GUI with data
 * */
function appendIssues(issues) {
    console.log("Life is good");
    issues.forEach(function (issue) {
        directRequest(issue.assignee, issue.key);
    })
    calculateMttr(issues);
}
/**
 * This function  calculates the MTTR from issues' data
 * */
function calculateMttr(issues) {
    issuesByPriority.length = 0; // clearing previous user data
    var lowestCount = 0, lowCount = 0, mediumCount = 0, highCount = 0, highestCount = 0;
    var lowestHours = 0, lowHours = 0, mediumHours = 0, highHours = 0, highestHours = 0;
    issues.forEach(function (issue) {
        var created = new Date(issue.created);
        var resolved = new Date(issue.resolutiondate);
        var hours = Math.abs(created - resolved) / 36e5;
        if (issue.resolutiondate !== null) {
            if (issue.priority == "Lowest") {
                lowestIssues.push({
                    key: issue.key,
                    mttr: hours,
                    priority: issue.priority,
                    recommended: 120
                })
                lowestCount++;
                lowestHours += hours;
            } else if (issue.priority == "Low") {
                lowIssues.push({
                    key: issue.key,
                    mttr: hours,
                    priority: issue.priority,
                    recommended: 96
                })
                lowCount++;
                lowHours += hours;
            } else if (issue.priority == "Medium") {
                mediumIssues.push({
                    key: issue.key,
                    mttr: hours,
                    priority: issue.priority,
                    recommended: 72
                })
                mediumCount++;
                mediumHours += hours;
            } else if (issue.priority == "High") {
                highIssues.push({
                    key: issue.key,
                    mttr: hours,
                    priority: issue.priority,
                    recommended: 48
                })
                highCount++;
                highHours += hours;
            } else {
                highestIssues.push({
                    key: issue.key,
                    mttr: hours,
                    priority: issue.priority,
                    recommended: 24
                })
                highestCount++;
                highestHours += hours;
            }
        }
    });
    if (lowestCount == 0) {
        issuesByPriority.push({
            priority: "Lowest", recommended: 120, avgMttr: 0, color: 'color: #FEF5DD'
        })
    } else {
        issuesByPriority.push({
            priority: "Lowest", recommended: 120, avgMttr: lowestHours / lowestCount, color: 'color: #FEF5DD'
        })
    }
    if (lowCount == 0) {
        issuesByPriority.push({
            priority: "Low", recommended: 96, avgMttr: 0, color: 'color: #F9DA81'
        })
    } else {
        issuesByPriority.push({
            priority: "Low", recommended: 96, avgMttr: lowHours / lowCount, color: 'color: #F9DA81'
        })
    }
    if (mediumCount == 0) {
        issuesByPriority.push({
            priority: "Medium", recommended: 72, avgMttr: 0, color: 'color: #F4B841'
        })
    } else {
        issuesByPriority.push({
            priority: "Medium", recommended: 72, avgMttr: mediumHours / mediumCount, color: 'color: #F4B841'
        })
    }
    if (highCount == 0) {
        issuesByPriority.push({
            priority: "High", recommended: 48, avgMttr: 0, color: 'color: #EE732E'
        })
    } else {
        issuesByPriority.push({
            priority: "High", recommended: 48, avgMttr: highHours / highCount, color: 'color: #EE732E'
        })
    }
    if (highestCount == 0) {
        issuesByPriority.push({
            priority: "Highest", recommended: 24, avgMttr: 0, color: 'color: #C32928'
        })
    } else {
        issuesByPriority.push({
            priority: "Highest", recommended: 24, avgMttr: highestHours / highestCount, color: 'color: #C32928'
        })
    }

    console.log("PRIORITIZED: " + JSON.stringify(issuesByPriority));

    google.charts.load('current', { packages: ['corechart', 'bar'] });
    google.charts.setOnLoadCallback(drawMultSeries);

    function drawMultSeries() {
        const data = new google.visualization.DataTable();

        data.addColumn('string', 'Priority');
        data.addColumn('number', 'Recommended');
        data.addColumn('number', 'Actual');
        data.addColumn({ type: 'string', role: 'style' }); //needs to be after the values column

        issuesByPriority.forEach(function (issue) {
            data.addRows([
                [issue.priority, issue.recommended, issue.avgMttr, issue.color]
            ]);
        })

        var options = {
            title: 'Mean time to resolve',
            legend: { position: 'none' },
            width: "600",
            height: "300",
            hAxis: {
                title: 'Priority of ticket',
            },
            vAxis: {
                title: 'Hours', format: '#h'
            },
            colors: ['#ccff66', '#e6693e'],
            is3D: true
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
    $("#hoverMessage").hide();
    queryRequest(uniqueProjectUsers);
    console.log("Life is great");
};

// ------------------- Function calls -----------------

switchViews();
getUsers();
getProjects();
displayNotice();