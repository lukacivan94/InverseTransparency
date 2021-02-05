function switchViews() {
    $("#projectView").hide();
    $("#selectProjectDiv").hide();
    $('#viewSelector').on('click', 'a', function () {
        if ($(this).hasClass("userView")) {
            $("#userView").show();
            $("#projectView").hide();
            $("#selectProjectDiv").hide();
            $("#selectUserDiv").show();
            $("#viewSelector").html('user view | <a href="#" class="projectView">project view</a>');
        }
        if ($(this).hasClass("projectView")) {
            $("#userView").hide();
            $("#projectView").show();
            $("#selectUserDiv").hide();
            $("#selectProjectDiv").show();
            $("#viewSelector").html('<a href="#" class="userView">user view</a> | project view');
        }
        return false;
    });
}

//this function needs to push issues to graphs
function appendIssues(issues){
    console.log("Life is good");
    calculateMttr(issues);
}

function calculateMttr(issues){
    issues.forEach(function(issue){
        var created = new Date(issue.created);
        var resolved = new Date(issue.resolutiondate);
        console.log("DATES ARE HERE:" + created + "-----" + resolved);
        var hours = Math.abs(created - resolved) / 36e5;
        console.log("HOURS ARE HERE:" + hours);
    })
}

//this function is only here because it's extracted to common.js and being called there
function getUsersOfProject(){
    console.log("Life is great");
};

switchViews();