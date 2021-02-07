/**
 * @file
 * Functionality used by Workload plugin.
 */

// ------------------- Variables -----------------

const usersWithNumberOfIssues = [];

// ------------------- Functions -----------------


function appendIssues(issues) {
    //console.log("[PROJECT ISSUES]: " + JSON.stringify(issues));
}

// uniqueProjectUsers array has already been populated with the getProjects function call
// and can be used here
function appendUsers() {
    usersWithNumberOfIssues.length = 0;
    uniqueProjectUsers.forEach(function (user) {
        var numberOfIssues = 0;
        issuesOfProject.forEach(function (issue) {
            if (issue.assignee == user) {
                numberOfIssues++;
            }
        })
        usersWithNumberOfIssues.push({
            user: user,
            numberOfIssues: numberOfIssues
        })
        //console.log("USERS AND ISSUE NUMBER: " + JSON.stringify(usersWithNumberOfIssues));
    })
    buildPieChart();
};


// TODO: Unassigned issues
function buildPieChart() {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {

        const data = new google.visualization.DataTable();

        data.addColumn('string', 'User');
        data.addColumn('number', 'Number of Issues');

        usersWithNumberOfIssues.forEach(function (user) {
            data.addRows([
                [user.user, user.numberOfIssues]
            ]);
        })

        var options = {
            title: 'Number of assigned issues',
            legend: { position: 'bottom', maxLines: 3 },
            is3D: true
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(data, options);
    }
}

// ------------------- Function calls -----------------

getProjects();