/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Functions -----------------

/**
 * This function  triggers a directRequest function and populates the GUI with data
 * */
function appendIssues(issues) {

    issues.forEach(function (issue) {
        directRequest(issue.assignee, issue.key);
    })
    
    var table = document.getElementById("userIssuesTable");

    // Clear the table from previous issues - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };

    issues.forEach(function (object) {
        if (object.assignee !== "Unassigned") {
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
        }
    });
    buildCalendar(issues);
}

/**
 * This function  triggers a queryRequest function and populates the GUI with data
 * */
function appendUsers() {
    var table = document.getElementById("projectUsersTable");

    // Clear the table from previous users - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };
    uniqueProjectUsers.forEach(function (user) {
        var sortedIssues = sortUserIssues(user);
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:center'>" + user + "</td>" +
            "<td style='text-align:center; background-color:#DBFFAB''>" + sortedIssues.numberOfGreenIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.numberOfRedIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.successRate + "</td>";
        table.appendChild(tr);
    });

    queryRequest(uniqueProjectUsers);
}

/**
 * This function sorts the red and green issues
 * */
function sortUserIssues(user) {
    var numberOfRedIssues = 0;
    var numberOfGreenIssues = 0;
    for (let i = 0; i < issuesOfProject.length; i++) {
        if (issuesOfProject[i].assignee == user) {
            if (issuesOfProject[i].category == "red") {
                numberOfRedIssues++;
            } else {
                numberOfGreenIssues++;
            }
        }
    }
    var totalIssues = numberOfGreenIssues + numberOfRedIssues;
    var successRate = Math.round(numberOfGreenIssues / totalIssues * 100) + "%";
    return {
        user: user,
        numberOfRedIssues: numberOfRedIssues,
        numberOfGreenIssues: numberOfGreenIssues,
        successRate: successRate
    };
}

/**
 * This function builds the Calendar and displays issues of the selected user
 */
function buildCalendar(issues) {
    var calendarEl = document.getElementById('calendar');
    var events = issues.map(issue => {
        return {
            id: issue.key,
            groupId: issue.assignee,
            title: issue.key,
            start: issue.duedate,
            color: issue.category,
            assignee: issue.assignee,
            tip: "By clicking on issue you can see the details and data subject will get notified"
        }
    })
    console.log("Issues within buildCalendar: " + JSON.stringify(issues));

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: '2021-01-07',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        eventClick: function (info) {
            console.log("This is the assignee from event: " + info.event.groupId + ", key: " + info.event.id);
            directRequest(info.event.groupId, info.event.id);
            window.open('http://localhost:2990/jira/browse/'+info.event.id,'_blank')
        },
    });

    calendar.render();

    console.log("Calendar has been built");
}

/** 
 * This function switches between different views of the plugin
 * List / Calendar / Project view
*/
function switchViews() {
    $("#hoverMessage").show();
    $("#hoverMessageProject").hide();
    $("#listView").hide();
    $("#projectView").hide();
    $("#selectProjectDiv").hide();
    $('#viewSelector').on('click', 'a', function () {
        if ($(this).hasClass("calendarView")) {
            $("#listView").hide();
            $("#calendarView").show();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('calendar view | <a href="#" class="listView">list view</a> | <a href="#" class="projectView">project view</a>');
            $("#hoverMessageProject").hide();
            $.ajax({
                url: getIssuesOfUser(),
                success: function () {
                    buildCalendar(issuesOfUser);
                }
            });
        }
        if ($(this).hasClass("listView")) {
            $("#listView").show();
            $("#calendarView").hide();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('<a href="#" class="calendarView">calendar view</a> | list view | <a href="#" class="projectView">project view</a>');
            $("#hoverMessageProject").hide();
            $("#hoverMessage").show();
            appendIssues(issuesOfUser);
        }
        if ($(this).hasClass("projectView")) {
            $("#listView").hide();
            $("#calendarView").hide();
            $("#projectView").show();
            $("#selectUserDiv").hide();
            $("#selectProjectDiv").show();
            $("#viewSelector").html('<a href="#" class="calendarView">calendar view</a> | <a href="#" class="listView">list view</a> | project view');
            $("#hoverMessage").show();
            $("#hoverMessageProject").show();
        }
        return false;
    });
}

// ------------------- Function calls -----------------

getUsers();
getProjects();
switchViews();
displayNotice();