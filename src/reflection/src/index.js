const dotenv = require('dotenv');
dotenv.config();

const db = require('./config');
const wotnectivity = require('wotnectivity-knx');

var thingInteractionSchema = require('./models');
const { set } = require('./models');

var ThingInteraction = db.model('ThingInteraction', thingInteractionSchema);

var interactions = {}
var lastInteractionTime = {};


async function subToInteractions(){
    var statusProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI,{ requestType: "subscribe", groups: [{group: "2/0/1", dataType: "DPT1.001"},{group: "2/1/1", dataType: "DPT1.001"},{group: "5/1/0", dataType: "DPT1.001"},{group: "5/0/0", dataType: "DPT1.001"},{group: "3/0/3", dataType: "DPT5.001"},{group: "3/1/3", dataType: "DPT5.001"}]})

    statusProp.subscribe(async (data)=>{
        
        var interactionValue=new ThingInteraction({
            device: "acg:lab:suitcase-dd",
            origen: "physicalDevice",
            interaction: "property.status",
            data: data
        })
        switch (data.group) {
            case "2/0/1":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.status-light1";
                interactionValue.data = {value:data.value}
                break;
            case "2/1/1":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.status-light2";
                interactionValue.data = {value:data.value}
                break;
            case "5/1/0":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.status-water";
                interactionValue.data = {value:data.value}
                break;
            case "5/0/0":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.status-fire";
                interactionValue.data = {value:data.value}
                break;
            case "3/0/3":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.luminosity-dimmer1";
                interactionValue.data = {brightness:data.value};
                break;
            case "3/1/3":
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "property.luminosity-dimmer2";
                interactionValue.data = {brightness:data.value};
                break;
            default:
                interactionValue.device = "acg:lab:suitcase-dd";
                interactionValue.interaction = "unknown";
                break;
        }

        console.log(interactionValue)
        interactionValue.save(function(err){
            if(err){
                 console.log(err);
                 return;
            }
        })
    })
}

async function executeInteractions(){

    ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "user"}, {"fullDocument.device": "acg:lab:suitcase-dd"}]}}]).on('change', async change => {
        var response = new ThingInteraction(change.fullDocument);
        switch (response.interaction){
            case "property.status-light1":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "action.switch-light1":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "property.status-light2":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "action.switch-light2":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "property.status-fire":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "action.switch-fire":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "property.status-water":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "action.switch-water":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, response.data.value);
                break;
            case "property.luminosity-dimmer1":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, response.data.brightness);
                break;
            case "property.luminosity-dimmer2":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, response.data.brightness);
                break;
            case "action.switch-dimmer1":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, response.data.brightness);
                break;
            case "action.switch-dimmer2":
                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, response.data.brightness);
                break;
            default:
                break;
        } 
        // 
        // if(response.interaction in lastInteractionTime && response.createdAt.getTime()-lastInteractionTime[response.interaction]<2000) {
        //     if(interactions[response.interaction]) interactions[response.interaction].push(response)
        //     else{
        //         interactions[response.interaction] = []
        //         interactions[response.interaction].push(response)
        //     }
        //     /* if(interactions[response.interaction][interactions[response.interaction].length-1].createdAt.getTime() - interactions[response.interaction][0].createdAt.getTime() >= 10000){
        //         console.log("mas de 10 sec")
        //         if(typeof(response.value)==="boolean"){
        //             var a = interactions[response.interaction].reduce(function (acc, curr) {
        //                 if (typeof acc[""+curr.value] == 'undefined') {
        //                   acc[""+curr.value] = 1;
        //                 } else {
        //                   acc[""+curr.value] += 1;
        //                 }
                      
        //                 return acc;
        //               }, {});
        //               if(a["true"]>a["false"]) var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, true);
        //               else var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, false);
        //               console.log(a)
        //               interactions[response.interaction] = [];
        //         }
        //     } 
        //     else{
        //         console.log("waiting to finish window")
        //     } */
        }
        /*
        else {
            lastInteractionTime[response.interaction] = response.createdAt.getTime()
            if(interactions[response.interaction]||interactions[response.interaction]==[]){
                interactions[response.interaction].push(response)
            }
            else{
                interactions[response.interaction] = []
                interactions[response.interaction].push(response)
            }
            switch (response.interaction){
                case "property.status-light1":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "action.switch-light1":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "property.status-light2":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "action.switch-light2":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "property.status-fire":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "action.switch-fire":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "property.status-water":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "action.switch-water":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, response.data.value);
                    break;
                case "property.luminosity-dimmer1":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, response.data.brightness);
                    break;
                case "property.luminosity-dimmer2":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, response.data.brightness);
                    break;
                case "action.switch-dimmer1":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, response.data.brightness);
                    break;
                case "action.switch-dimmer2":
                    var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, response.data.brightness);
                    break;
                default:
                    break;
            } 
            //var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, response.value);
            executeWindow(response)
        } 
        
    }
    */
    );

}

/* async function executeWindow(response){
    setTimeout(async () =>{
        if(interactions[response.interaction].length > 1){
            if(typeof(interactions[response.interaction][0].data.value)==="boolean"){
                var a = await interactions[response.interaction].reduce(function (acc, curr) {
                    if (typeof acc[""+curr.data.value] == 'undefined') {
                        acc[""+curr.data.value] = 1;
                    } else {
                        acc[""+curr.data.value] += 1;
                    }
                    return acc;
                    }, {});
                    if(!a["true"]) a["true"]=0
                    if(!a["false"]) a["false"]=0
                    if(a["true"]>a["false"]){
                        switch (response.interaction){
                            case "property.status-light1":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, true);
                                break;
                            case "action.switch-light1":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, true);
                                break;
                            case "property.status-light2":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, true);
                                break;
                            case "action.switch-light2":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, true);
                                break;
                            case "property.status-fire":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, true);
                                break;
                            case "action.switch-fire":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, true);
                                break;
                            case "property.status-water":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, true);
                                break;
                            case "action.switch-water":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, true);
                                break;
                            default:
                                break;
                        }
                    } 
                    else{
                        switch (response.interaction){
                            case "property.status-light1":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, false);
                                break;
                            case "action.switch-light1":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/0/0", dataType: "DPT1.001" }, false);
                                break;
                            case "property.status-light2":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, false);
                                break;
                            case "action.switch-light2":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "2/1/0", dataType: "DPT1.001" }, false);
                                break;
                            case "property.status-fire":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, false);
                                break;
                            case "action.switch-fire":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/0/0", dataType: "DPT1.001" }, false);
                                break;
                            case "property.status-water":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, false);
                                break;
                            case "action.switch-water":
                                var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "5/1/0", dataType: "DPT1.001" }, false);
                                break;
                            default:
                                break;
                        }
                    } 
                    lastInteractionTime[response.interaction] = interactions[response.interaction][interactions[response.interaction].length-1].createdAt.getTime();
                    interactions[response.interaction] = [];
                    executeWindow(response); 
            }
            else{
                var a = await interactions[response.interaction].reduce(function (acc, curr) {
                    
                    if (typeof acc["value"] == 'undefined') {
                        acc["value"] = 0;
                    } else {
                        
                        if (curr.data.brightness >= 0 && curr.data.brightness<=100) {
                            acc["value"] += curr.data.brightness;
                       } else {
                            
                       }
                    }
                    
                    return acc;
                }, {});
                switch (response.interaction){
                    case "property.luminosity-dimmer1":
                        var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, a["value"]/interactions[response.interaction].length);
                        break;
                    case "action.switch-dimmer1":
                        var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/0/2", dataType: "DPT5.001" }, a["value"]/interactions[response.interaction].length);
                        break;
                    case "property.luminosity-dimmer2":
                        var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, a/interactions[response.interaction].length);
                        break;
                    case "action.switch-dimmer2":
                        var reqProp = await wotnectivity.sendRequest(process.env.SUITCASE_URI, { requestType: "write", group: "3/1/2", dataType: "DPT5.001" }, a/interactions[response.interaction].length);
                        break;
                    default:
                        break;
                }
                lastInteractionTime[response.interaction] = interactions[response.interaction][interactions[response.interaction].length-1].createdAt.getTime();
                interactions[response.interaction] = [];
                executeWindow(response); 
            }
        }

    },2000);
    
}
*/

subToInteractions()
executeInteractions()