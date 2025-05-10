const ThingInteraction = require('./models'); // Importar modelo
const td = require('./tdLoader'); // Importar TD cargado

async function effectsControl(){
    if (!td || !td.effects) {
        console.error("td or td.effects is not defined");
        return;
    }

    var causes=[[]];
    var effectsKeys = Object.keys(td.effects)
    console.log(effectsKeys)
    effectsKeys.forEach((key,effectIndex)=>{
        
            td.effects[key].causes.forEach((cause, causeIndex)=>{
                console.log("CausesIn")
                ThingInteraction.watch([{$match: {$and: [  { "fullDocument.origen": "physicalDevice"}, {"fullDocument.interaction": cause.interactionType+"."+cause.interaction }]}}]).on('change', async change => {
                    causes[effectIndex][causeIndex]=change.fullDocument;
                    console.log("interaction watched")
                    if(td.effects[key].window){
                        var inWindow = await calcWindow(causes[effectIndex], td.effects[key])
                        console.log(inWindow);
                        if(inWindow) evalExpresion(causes[effectIndex], td.effects[key])
                    }
                })
            });
        });
    
}

async function calcWindow(causes, effect){
    //console.log(causes);
    //console.log(effect);
    if(causes.length == effect.causes.length){
        if(!effect.hasOrder){
            causes.sort((a, b) => {return a.createdAt.getTime()-b.createdAt.getTime()})
        }
        var timeBetween = 0;
        causes.forEach((element,indexElement) => {
            if(indexElement==0);
            else{
                    var auxTime = (element.createdAt.getTime()-causes[indexElement-1].createdAt.getTime())/1000;
                    if(auxTime < 0){
                        timeBetween+= -Infinity;
                    }
                    else{
                        timeBetween+= auxTime;   
                    }  
            } 
        });
        console.log(effect.window);
        console.log(timeBetween);
        if(effect.window-Math.abs(timeBetween)>0 && effect.window-Math.abs(timeBetween)<effect.window) return true;
    }
    return false;
}

async function evalExpresion(causes, effect){
    eval(effect.evalExpression);
}

module.exports = { effectsControl };