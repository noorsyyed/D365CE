

var MW = MW || {};

function onLoad(executionContext) {
    MW.formContext = executionContext.getFormContext();
    MW.oppId = MW.formContext.data.entity.getId().substring(1, 37);
    MW.userId = Xrm.Utility.getGlobalContext().userSettings.userId.substring(1, 37);
    getOpenPhonecallCount();
}


function addPhonecallActivity(params) {
    
    var data =
    {
        "subject": `${MW.formContext.data.entity.getPrimaryAttributeValue()} followup`,
        "regardingobjectid_opportunity@odata.bind": `/opportunities(${MW.oppId})`,
        // "from@odata.bind": `systemusers(${MW.userId})`,
        // "to@odata.bind": `systemusers(${MW.userId})`,
        "prioritycode": 1,
        "directioncode": true,
        "phonecall_activity_parties": [
            {
                "partyid_systemuser@odata.bind": `/systemusers(${MW.userId})`, // call started by a systemuser
                "participationtypemask": 1 // From
            },
            {
                "partyid_contact@odata.bind": `/contacts(${MW.formContext.getAttribute('parentcontactid').getValue()[0].id.substring(1, 37)})`, // call to by a contact
                "participationtypemask": 2 // To
            }
        ]
    }

    // create account record
    Xrm.WebApi.createRecord("phonecall", data).then(
        function success(result) {
            console.log("Phonecall created with ID: " + result.id);
        },
        function (error) {
            Xrm.Utility.alertDialog(error.message);
        }
    );
}

function getOpenPhonecallCount(params) {
    Xrm.WebApi.retrieveMultipleRecords("opportunity", `?$apply=filter((opportunityid eq df26079d-0d55-4e31-a34c-079e4cd6238f) and (Opportunity_ActivityPointers/any(o1:(o1/statecode eq 0))))/aggregate($count as opp)`).then(
        function success(result) {
            if (result.entities.length && result.entities[0].opp) {
                showDialog();
            }

        },
        function (error) {
            Xrm.Utility.alertDialog(error.message);
        }
    );

}

function showDialog(params) {
    var confirmStrings = {
        text: " There are no phone calls for this opportunity. Do you want to automatically create a followup phone call?", title: "Phone call followup"
    };
    var confirmOptions = { height: 100, width: 600 };
    Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
        function (success) {
            if (success.confirmed) {
                console.log("Dialog closed using OK button.");
                addPhonecallActivity();
            }
        });
}

async function getOpportunityContact(params) {
    //https://multi-wing-dev.crm4.dynamics.com/api/data/v9.2/opportunities?$select=_parentcontactid_value
    return new Promise((resolve, reject) => {
        Xrm.WebApi.retrieveRecord("opportunity", MW.oppId, "?$select=_parentcontactid_value").then(
            function success(result) {
                console.log(result);
                resolve(result);
            },
            function (error) {
                console.error(error.message);
                Xrm.Utility.alertDialog(error.message);
                reject(error);
            }
        );
    });


}
