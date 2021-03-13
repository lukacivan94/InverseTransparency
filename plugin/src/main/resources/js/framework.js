
var loggedInUser;
var retrievedUser;
const owners = []//['"jan@example.com"', '"lukac.ivan94@gmail.com"'];

var prefs = new gadgets.Prefs(); // user preference for notice
//var noticeAccepted = false; //variable used across all plugins

// ------------------- Functions -----------------

// This function is set just to switch the accepted to false on button click to help showcasing
function setAcceptedToFalse() {
    prefs.set("isAccepted", 0);
    console.log("Is accepted: " + prefs.getInt("isAccepted"))
}

/**
 * This function  */
function displayNotice() {
    //if (!noticeAccepted) {
    var variable = prefs.getInt("isAccepted");
    console.log("variable: " + variable);
    if (prefs.getInt("isAccepted") == 0) {
        $("#spacerbox").append($('<div id="modalNotice" class="modal" tabindex="-1" role="dialog" style="height:600"> <div class="modal-dialog" role="document"> <div class="modal-content"> <div class="modal-header"> <h5 class="modal-title">Inverse Transparency Notice</h5></div> <div class="modal-body"> <div class="form-group"> <label for="noticeText1">This Dashboard gadget is part of the Inverse Transparency plugin</label><label for="noticeText2">By continuing you agree to exposing your username to the respective data owner whose data you are accessing. Data owner will be notified per every issue access.</label> </div> </div> <div class="modal-footer">  <button type="button" class="btn btn-primary" onClick="acceptNotice()">Accept and Continue</button> </div> </div> </div> </div>'));
        $('#modalNotice').modal({
            backdrop: 'static', // when you click outside of modal
            keyboard: false     //or esc on keyboard modal doesn't disappear
        });
        $('#modalNotice').modal('show');
    }
}

/**
 * This function 
 */
function acceptNotice() {
    prefs.set("isAccepted", 1);
    //noticeAccepted = true;
    $('#modalNotice').modal('hide');
    //console.log("Notice has now been hidden and is set to: " + noticeAccepted);
    console.log("Is accepted: " + prefs.getInt("isAccepted"))
}

//works
// getting the email of the assignee (data owner whose data we look at)
function directRequest(assignee, issueKey) {
    fetch("http://localhost:2990/jira/rest/api/2/user?username=" + assignee)
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
                console.log(JSON.stringify(resultJson));
                retrievedUser = {
                    key: resultJson.key,
                    name: resultJson.name,
                    emailAddress: resultJson.emailAddress
                }
                console.log("Retrieved user details: " + JSON.stringify(retrievedUser));
                getLoggedInUser(retrievedUser, issueKey);
            }
        });
}

// getting vague data on logged in user (data consumer) then chain 
//request to get detailed data and save it to loggedInUser variable
function getLoggedInUser(retrievedUser, issueKey) {
    fetch("/jira/rest/auth/latest/session")
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
                console.log(JSON.stringify(resultJson));
                loggedInUser = resultJson.name;
                console.log("Logged in user details: " + JSON.stringify(loggedInUser) +
                    "retrieved user: " + retrievedUser.emailAddress);
                const requestBody = '{"data_types":["string"],"justification":"Issue: ' + issueKey + '","tool":"jira","user":"' + loggedInUser + '","owner":"' + retrievedUser.emailAddress + '"}'

                fetchDirect(requestBody);
            }
        });
}

function fetchDirect(requestBody) {
    const fetchBody = {
        method: "POST",
        headers: {
            accept: "application/json",
            Authorization: "Basic " + btoa("techie:some_body_00"),
            "Content-Type": "application/json"
        },
        body: requestBody
    };

    fetch("https://overseer.sse.in.tum.de/request-access/direct", fetchBody)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                console.log("[ERROR]: " + response.json())
                return undefined;
            }
        }).then(function (resultJson) {
            if (resultJson !== undefined) {
                console.log("Answer: " + JSON.stringify(resultJson));
                if (resultJson.granted) {
                    $("#hoverMessage").hide();
                }
            }
        });
}


function queryRequest(assignees) {
    $.ajax({
        url: getOwners(assignees),
        success: function () {
            getLoggedInUserForQueryRequest(owners);
        }
    });
}

// this function recieves a list of assignee names and fetches their emails
// and pushes them in owners array because FastAPI needs emails for owners array
function getOwners(assignees) {
    console.log("assignees: " + assignees);
    owners.length = 0;
    assignees.forEach(assignee => {
        if (assignee !== "Unassigned") {
            fetch("http://localhost:2990/jira/rest/api/2/user?username=" + assignee)
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
                        //console.log(JSON.stringify(resultJson));
                        owners.push(resultJson.emailAddress);
                        //console.log("Retrieved user details: " + JSON.stringify(retrievedUser));
                        //console.log("ALl Retrieved users details: " + JSON.stringify(owners));
                    }
                });
        }
    });
}

function getLoggedInUserForQueryRequest(owners) {
    fetch("/jira/rest/auth/latest/session")
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
                //console.log(JSON.stringify(resultJson));
                loggedInUser = resultJson.name;
                //console.log("Logged in user details: " + JSON.stringify(loggedInUser));
                var ownersBody = owners.join('","')
                console.log(ownersBody);
                const requestBody = '{"data_types":["string"],"justification":"Issues of project: ' + currentProject + '","tool":"jira","user":"' + loggedInUser + '","owners": ["' + ownersBody + '"]}'
                console.log(requestBody);
                fetchQuery(requestBody);
            }
        });
}


function fetchQuery(requestBody) {
    $("#hoverMessageProject").show();
    const fetchBody = {
        method: "POST",
        headers: {
            accept: "application/json",
            Authorization: "Basic " + btoa("techie:some_body_00"),
            "Content-Type": "application/json"
        },
        body: requestBody
    };

    fetch("https://overseer.sse.in.tum.de/request-access/query", fetchBody)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                console.error("JIRA API call failed");
                console.log("[ERROR]: " + response.json())
                return undefined;
            }
        }).then(function (resultJson) {
            if (resultJson !== undefined) {
                console.log("Answer: " + JSON.stringify(resultJson));
                if (resultJson.granted) {
                    $("#hoverMessageProject").hide();
                }
            }
        });
}




// //works
// function queryRequest() {
//     //owners.push("jan@example.com");
//     //owners.push("lukac.ivan94@gmail.com");
//     console.log("OWNERS: " + owners);
//     const requestBody = '{"data_types":["string"],"justification":"this is a query test from Ivan","tool":"jira","user":"demo1_jira","owners": [' + owners + ']}'

//     const fetchBody = {
//         method: "POST",
//         headers: {
//             accept: "application/json",
//             Authorization: "Basic " + btoa("techie:some_body_00"),
//             "Content-Type": "application/json"
//         },
//         body: requestBody
//     };

//     fetch("https://overseer.sse.in.tum.de/request-access/query", fetchBody)
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
// }
