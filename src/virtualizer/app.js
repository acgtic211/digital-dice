// Importa la conexión a la base de datos
require('./configdb');  // Asegúrate de que la ruta a db.js sea correcta

const math = require("mathjs");
const Behavior = require("./model"); // Ruta al modelo de Mongoose
const affordance = require("./affordance.json");

/**
 * Replaces dot notation in expressions with mathjs compatible object access syntax
 * @param {string} expression - Expression with dot notation like "property.temperature * 1.5"
 * @returns {string} Expression with proper mathjs syntax
 */
function preprocessExpression(expression) {
    // Find all potential variables with dot notation
    const matches = expression.match(/[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];
    
    let processedExpression = expression;
    for (const match of matches) {
        // Replace "property.temperature" with "property['temperature']"
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
            
            // Build the nested structure
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            
            // Set the value at the deepest level
            current[parts[parts.length - 1]] = value;
        } else {
            // For non-dot keys, just copy directly
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
    while (u === 0) u = Math.random(); // Avoid zero
    while (v === 0) v = Math.random(); // Avoid zero
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * standardDeviation + mean;
}

async function applyBehavior() {
    try {
        // Start with default values
        let currentValues = { ...affordance.default_values };
        // Keep track of all applied changes by property
        const appliedChanges = {};

        // Process each behavior
        for (let behavior of affordance.behaviour) {
            let result = {};

            if (behavior.map) {
                result[behavior.map.out] = behavior.map.value;
            } else if (behavior.list) {
                result[behavior.list.out] = behavior.list.values[behavior.list.index];
            } else if (behavior.arithmeticExpression) {
                const originalExpression = behavior.arithmeticExpression.eval_exp;
                const processedExpression = preprocessExpression(originalExpression);
                
                console.log(`Original expression: ${originalExpression}`);
                console.log(`Processed expression: ${processedExpression}`);
                
                // Convert flat keys to nested structure for mathjs evaluation
                const nestedValues = convertToNestedObject(currentValues);
                
                try {
                    // Store the result in the output field specified by the behavior
                    const computedValue = math.evaluate(processedExpression, nestedValues);
                    result[behavior.arithmeticExpression.out] = computedValue;
                    console.log(`Evaluation result: ${computedValue}`);
                } catch (evalError) {
                    console.error(`Failed to evaluate expression: ${processedExpression}`);
                    console.error(`Available variables: ${Object.keys(nestedValues).join(', ')}`);
                    console.error(`Evaluation error: ${evalError.message}`);
                }
            } else if (behavior.conditional) {
                const originalExpression = behavior.conditional.eval_exp;
                const processedExpression = preprocessExpression(originalExpression);
                
                try {
                    if (math.evaluate(processedExpression, convertToNestedObject(currentValues))) {
                        result[behavior.conditional.out] = behavior.conditional.value;
                    }
                } catch (evalError) {
                    console.error(`Failed to evaluate conditional: ${processedExpression}`);
                    console.error(`Evaluation error: ${evalError.message}`);
                }
            } else if (behavior.distribution) {
                if (behavior.distribution.type === "normal") {
                    // Use custom randomNormal function for normal distribution
                    result[behavior.distribution.out] = randomNormal(
                        behavior.distribution.mean,
                        behavior.distribution.standard_deviation
                    );
                } else if (behavior.distribution.type === "discrete") {
                    result[behavior.distribution.out] = 
                        Math.floor(Math.random() * (behavior.distribution.max - behavior.distribution.min + 1)) + behavior.distribution.min;
                }
            }

            // Update current values for next behavior evaluation
            Object.assign(currentValues, result);
            
            // Save each property change individually for DB recording
            for (const [key, value] of Object.entries(result)) {
                appliedChanges[key] = value;
            }
        }

        // Now save each property change to MongoDB one by one
        for (const [property, value] of Object.entries(appliedChanges)) {
            console.log(`Saving property ${property} with value ${value} to MongoDB...`);
            
            try {
                const dataToInsert = new Behavior({
                    data: { [property]: value },
                    device: affordance.thing_id,
                    interaction: property,
                    origin: "virtualDevice"
                });

                const savedData = await dataToInsert.save();
                console.log(`Successfully saved to MongoDB: ${property}`, savedData._id);
            } catch (saveError) {
                console.error(`Error saving to MongoDB: ${saveError.message}`);
            }
        }

        // Check for fire condition (from conditional behavior)
        if (currentValues["property.fire"] === true) {
            console.log("Fire detected! Taking appropriate actions...");
        }

    } catch (error) {
        console.error("Error applying behavior:", error);
    }
}

/**
 * Start the continuous execution of behaviors based on timing
 */
function startVirtualizer() {
    // Get the timing value from the affordance (in milliseconds)
    const interval = affordance.timings;
    
    console.log(`Starting virtualizer with interval of ${interval}ms`);
    
    // Run applyBehavior immediately once
    applyBehavior();
    
    // Then set it to run repeatedly based on the interval
    setInterval(applyBehavior, interval);
    
    console.log(`Virtualizer is running. Press Ctrl+C to stop.`);
}

// Start the continuous execution process
startVirtualizer();
