/**
 * @file
 * Functionality used by Workload plugin.
 */

// ------------------- Variables -----------------

const usersWithNumberOfIssues = [];

// ------------------- Functions -----------------

/**
 * This function  functionality is migrated to appendUsers()
 * */
function appendIssues(issues) {}

/**
 * This function  triggers a queryRequest function and populates the GUI with data
 * */
function appendUsers() {
    queryRequest(uniqueProjectUsers);
    usersWithNumberOfIssues.length = 0;
    uniqueProjectUsers.forEach(function (user) {
        var numberOfIssues = 0;
        issuesOfProject.forEach(function (issue) {
            if (issue.assignee == user) {
                numberOfIssues++;
            }
        })
        if (user == 'Unassigned') {
            usersWithNumberOfIssues.push({
                user: user,
                numberOfIssues: numberOfIssues,
                color: 'color: #1678CC'
            })
        } else {
            usersWithNumberOfIssues.push({
                user: user,
                numberOfIssues: numberOfIssues
            })
        }
    })
    buildPieChart();
};

/**
 * This function  builds a Google Pie Chart
 * */
function buildPieChart() {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {

        const data = new google.visualization.DataTable();

        data.addColumn('string', 'User');
        data.addColumn('number', 'Number of Issues');
        data.addColumn({ type: 'string', role: 'style' }); //needs to be after the values column

        usersWithNumberOfIssues.forEach(function (user) {
            data.addRows([
                [user.user, user.numberOfIssues, user.color]
            ]);
        })

        var options = {
            title: 'Issue assignment distribution',
            legend: { position: 'bottom', maxLines: 3 },
            is3D: true
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(data, options);
    }
}

/**
 * This function hides the data when it is restricted by the user
 * */
function switchViews(){
    $("#hoverMessageProject").show();
}


// ------------------- Function calls -----------------

getProjects();
displayNotice();
switchViews();