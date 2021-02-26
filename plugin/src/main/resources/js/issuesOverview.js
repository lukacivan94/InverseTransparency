/**
 * @file
 * Functionality of the issues overview dashboard plugin.
 */

// ------------------- Variables -----------------


var unlocked = false;


// ------------------- Functions -----------------

function appendIssues(issues) {

    directRequest(issues[0].assignee, issues[0].key);

    //console.log("Within appendIssues function: " + issues.length);
    var table = document.getElementById("userIssuesTable");

    // Clear the table from previous issues - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };

    issues.forEach(function (object) {
        //console.log("Within foreach:" + object.key);

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

//provide a list of users 
function appendUsers() {
    //console.log("Within appendUsers function: " + uniqueProjectUsers.length);
    var table = document.getElementById("projectUsersTable");

    // Clear the table from previous users - anything but the header row
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    };
    uniqueProjectUsers.forEach(function (user) {
        var sortedIssues = sortUserIssues(user);
        //console.log("[ISSUES]: " + JSON.stringify(sortedIssues));
        var tr = document.createElement("tr");

        tr.innerHTML = "<td style='text-align:center'>" + user + "</td>" +
            "<td style='text-align:center; background-color:#DBFFAB''>" + sortedIssues.numberOfGreenIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.numberOfRedIssues + "</td>" +
            "<td style='text-align:center; background-color:#FF6A4B'>" + sortedIssues.successRate + "</td>";
        table.appendChild(tr);
    });
    queryRequest(uniqueProjectUsers);
}

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
    //console.log("[SUCCESS RATE]: " + successRate);
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
    if($("#hoverMessage").is(":visible")){
        console.log("Hover message is visible, Calendar not building")
        return;
    }
    //document.addEventListener('DOMContentLoaded', function () {//});
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
        },
        // eventMouseEnter: function (event) {
        //     $('#hoverMessage').show();
        // },
        // eventMouseLeave: function (event) {
        //     $('#hoverMessage').hide();
        // }
    });

    calendar.render();

    console.log("Calendar has been built");
}

function displayHoverMessage() {
    console.log("Hover message is displaying");
    $('#hoverMessage').show();
}

function hideHoverMessage() {
    console.log("Hover message is gone");
    $('#hoverMessage').hide();
}

/** 
 * This function switches between different views of the plugin
 * List / Calendar / Project view
*/
function switchViews() {
    //$("#calendarView").hide();
    $("#hoverMessage").hide();
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
            $.ajax({
                url: getIssuesOfUser(),
                success: function () {
                    buildCalendar(issuesOfUser);
                }
            });
            //buildCalendar(issuesOfUser);
        }
        if ($(this).hasClass("listView")) {
            $("#listView").show();
            $("#calendarView").hide();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('<a href="#" class="calendarView">calendar view</a> | list view | <a href="#" class="projectView">project view</a>');
        }
        if ($(this).hasClass("projectView")) {
            $("#listView").hide();
            $("#calendarView").hide();
            $("#projectView").show();
            $("#selectUserDiv").hide();
            $("#selectProjectDiv").show();
            $("#viewSelector").html('<a href="#" class="calendarView">calendar view</a> | <a href="#" class="listView">list view</a> | project view');
        }
        return false;
    });
}

function toggleIssueDetails() {
    unlocked = !unlocked;
    console.log("Unlocked: " + unlocked);
    buildCalendar(issuesOfUser);
}

/**
 * This function  */
function displayNotice() {
    if (!noticeAccepted) {
        $("#spacerbox").append($('<div id="modalNotice" class="modal" tabindex="-1" role="dialog" style="height:600"> <div class="modal-dialog" role="document"> <div class="modal-content"> <div class="modal-header"> <h5 class="modal-title">Inverse Transparency Notice</h5></div> <div class="modal-body"> <div class="form-group"> <label for="noticeText1">This Dashboard gadget is part of the Inverse Transparency plugin</label><label for="noticeText2">By continuing you agree to exposing your username to the respective data owner whose data you are accessing.</label> </div> </div> <div class="modal-footer">  <button type="button" class="btn btn-primary" onClick="acceptNotice()">Accept and Continue</button> </div> </div> </div> </div>'));
        $('#modalNotice').modal('show');
    }
}

/**
 * This function 
 */
function acceptNotice() {
    noticeAccepted = true;
    $('#modalNotice').modal('hide');
    console.log("Notice has now been hidden and is set to: " + noticeAccepted);
}


// ------------------- Function calls -----------------

getUsers();
getProjects();
//create populate() function to call all functions in background
switchViews();
//getUsers();
//getProjects();
displayNotice();
//getLoggedInUser();
//getUserDetails();
//getLoggedInUserDetails();
//getIssuesOfUser("valentin");




// removed functionality - restapi used
// function requestView(info) {

//     visibleIssues.push(({
//         key: "SP-2",
//         visible: true
//     }))
//     if (checkIfVisible(info.event.title)) {
//         displayVisibleIssue(info.event.title);
//     } else {
//         console.log("View has been requested for issue: " + info.event.title);
//         alert("View has been requested for issue: " + info.event.title);

//         // change the border color just for fun
//         info.el.style.borderColor = 'red';
//     }
// }