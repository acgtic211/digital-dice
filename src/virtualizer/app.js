require('./configdb');

const math = require("mathjs");
const Behavior = require("./model");
const affordance = require("./affordance.json");
const axios = require("axios");

/**
 * Replaces dot notation in expressions with mathjs compatible object access syntax
 * @param {string} expression - Expression with dot notation like "property.temperature * 1.5"
 * @returns {string} Expression with proper mathjs syntax
 */
function preprocessExpression(expression) {
    const matches = expression.match(/[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];
    
    let processedExpression = expression;
    for (const match of matches) {
        const parts = match.split('.');
        let replacement = parts[0];
        for (let i = 1; i < parts.length; i++) {
            replacement += `['${parts[i]}']`;
        }
        processedExpression = processedExpression.replace(match, replacement);
    }
    
    return processedExpression;
}

/**
 * Converts a flat object with dot notation keys to a nested object structure
 * @param {object} flatObj - Object with keys like "property.temperature"
 * @returns {object} Nested object like { property: { temperature: value } }
 */
function convertToNestedObject(flatObj) {
    const result = {};
    
    for (const [key, value] of Object.entries(flatObj)) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let current = result;
            
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            
            current[parts[parts.length - 1]] = value;
        } else {
            result[key] = value;
        }
    }
    
    return result;
}

/**
 * Generates a random number from a normal distribution
 * @param {number} mean - Mean of the distribution
 * @param {number} standardDeviation - Standard deviation of the distribution
 * @returns {number} Random number from the normal distribution
 */
function randomNormal(mean, standardDeviation) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * standardDeviation + mean;
}

/**
 * Makes an HTTP request to a ML model endpoint with the specified inputs
 * @param {string} url - The URL of the ML model endpoint
 * @param {object} data - The data to send to the endpoint
 * @param {object} headers - Optional headers to include in the request
 * @returns {Promise<any>} The response from the ML model or null if error
 */
async function callMlModel(url, data, headers = {}) {
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error(`Error calling ML model at ${url}:`, error.message);
        return null;
    }
}

let currentValues = {};

/**
 * Main function that applies all behaviors defined in the affordance
 * Processes each behavior type (map, list, arithmetic, conditional, distribution, ML model)
 * and updates the current values and database
 * @returns {Promise<void>}
 */
async function applyBehavior() {
    try {       
        if (Object.keys(currentValues).length === 0) {
            currentValues = { ...affordance.default_values };
        }
        
        const appliedChanges = {};

        updateListIndices();
        
        for (let behavior of affordance.behaviour) {
            let result = {};
            
            const inputs = behavior.inputs || [];
            const outputs = behavior.outputs || [];
            
            if (!outputs.length) {
                console.warn("Warning: Behavior has no outputs defined:", behavior.description);
                continue;
            }
            
            const output = outputs[0];

            if (behavior.map) {
                result[output] = behavior.map.value;
            } else if (behavior.list) {
                result[output] = behavior.list.values[behavior.list.index];
            } else if (behavior.arithmeticExpression) {
                const processedExpression = preprocessExpression(behavior.arithmeticExpression.eval_exp);
                
                try {
                    const computedValue = math.evaluate(processedExpression, convertToNestedObject(currentValues));
                    result[output] = computedValue;
                } catch (evalError) {
                    console.error(`Failed to evaluate expression: ${evalError.message}`);
                }
            } else if (behavior.conditional) {
                const processedExpression = preprocessExpression(behavior.conditional.eval_exp);
                
                try {
                    if (math.evaluate(processedExpression, convertToNestedObject(currentValues))) {
                        result[output] = behavior.conditional.value;
                    }
                } catch (evalError) {
                    console.error(`Failed to evaluate conditional: ${evalError.message}`);
                }
            } else if (behavior.distribution) {
                if (behavior.distribution.type === "normal") {
                    result[output] = randomNormal(
                        behavior.distribution.mean,
                        behavior.distribution.standard_deviation
                    );
                } else if (behavior.distribution.type === "discrete") {
                    result[output] = 
                        Math.floor(Math.random() * (behavior.distribution.max - behavior.distribution.min + 1)) + behavior.distribution.min;
                }
            } else if (behavior.mlModel) {
                const mlInputData = {};
                for (const inputProp of inputs) {
                    const propName = inputProp.split('.').pop();
                    mlInputData[propName] = currentValues[inputProp];
                }
                
                try {
                    const mlResponse = await callMlModel(
                        behavior.mlModel.url, 
                        mlInputData,
                        behavior.mlModel.headers || {}
                    );
                    
                    if (mlResponse !== null) {
                        if (typeof mlResponse === 'object') {
                            const responseValue = 
                                mlResponse.prediction || 
                                mlResponse.result || 
                                mlResponse.value || 
                                Object.values(mlResponse)[0];
                                
                            result[output] = responseValue;
                        } else {
                            result[output] = mlResponse;
                        }
                    }
                } catch (mlError) {
                    console.error(`Error processing ML model response: ${mlError.message}`);
                }
            }

            Object.assign(currentValues, result);
            
            for (const [key, value] of Object.entries(result)) {
                appliedChanges[key] = value;
            }
        }

        for (const [property, value] of Object.entries(appliedChanges)) {
            try {
                const dataToInsert = new Behavior({
                    data: { [property]: value },
                    device: affordance.thing_id,
                    interaction: property,
                    origin: "virtualDevice"
                });

                await dataToInsert.save();
            } catch (saveError) {
                console.error(`Error saving to MongoDB: ${saveError.message}`);
            }
        }

    } catch (error) {
        console.error("Error applying behavior:", error);
    }
}

/**
 * Updates indices for all list behaviors to ensure values change over time
 * Increments each list's index and wraps back to 0 when reaching the end
 */
function updateListIndices() {
    const listBehaviors = affordance.behaviour.filter(b => b.list);
    
    if (listBehaviors.length === 0) {
        return;
    }
    
    listBehaviors.forEach(behavior => {
        const currentIndex = behavior.list.index;
        const maxIndex = behavior.list.values.length - 1;
        
        behavior.list.index = (currentIndex + 1) > maxIndex ? 0 : currentIndex + 1;
    });
}

/**
 * Logs the current status of all list behaviors in the affordance
 * Including their properties, available values, and current index
 */
function logListBehaviorsStatus() {
    const listBehaviors = affordance.behaviour.filter(b => b.list);
    
    if (listBehaviors.length === 0) {
        return;
    }
}

/**
 * Starts the virtualizer by initializing behaviors and setting up
 * the interval-based behavior application based on affordance timing
 */
function startVirtualizer() {
    const interval = affordance.timings;
    
    console.log(`Starting virtualizer with interval of ${interval}ms`);
    
    logListBehaviorsStatus();
    
    setInterval(() => {
        applyBehavior();
    }, interval);
    
    console.log(`Virtualizer is running`);
}

startVirtualizer();
