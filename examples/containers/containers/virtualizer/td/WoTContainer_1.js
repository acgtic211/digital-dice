var td = {
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "id": 1,
    "title": "ACG Container",
    "@type": "Container",
    "securityDefinitions": {
        "basic_sc": {
            "scheme": "nosec"
        }
    },
    "security": [
        "nosec"
    ],
    "properties": {
        "location": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "string"
                }
            },
            "required": [ "value" ],
            "forms": [
                {
                    "op": [ "readproperty", "writeproperty" ],
                    "href": "http://localhost:3000/container/1/location",
                    "contentType": "application/json"
                }
            ]
        },
        "garbageLevel": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "number",
                    "min": 0,
                    "max": 100,
                }
            },
            "required": [ "value" ],
            "forms": [
                {
                    "op": [ "readproperty", "writeproperty" ],
                    "href": "http://localhost:3000/container/1/garbageLevel",
                    "contentType": "application/json"
                }
            ]
        },
        "capacity": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "number",
                    "min": 0,
                }
            },
            "required": [ "value" ],
            "description": "Container´s capacity in kilograms",
            "forms": [
                {
                    "op": [ "readproperty" ],
                    "href": "http://localhost:3000/container/1/capacity",
                    "contentType": "application/json"
                }
            ]
        },
        "garbageClass": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "string"
                }
            },
            "required": [ "value" ],
            "forms": [
                {
                    "op": [ "readproperty", "writeproperty" ],
                    "href": "http://localhost:3000/container/1/garbageClass",
                    "contentType": "application/json"
                }
            ]
        }
    },
    "actions": {
        "collectGarbage": {
            "title": "Collect garbage",
            "description": "Garbage is collected, emptying the container",
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "http://localhost:3000/container/1/collectGarbage",
                    "contentType": "application/json"
                }
            ]
        },
        "triggerFire": {
            "title": "Trigger fire",
            "description": "Triggers the fire event",
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "http://localhost:3000/container/1/triggerFire",
                    "contentType": "application/json"
                }
            ]
        },
        "changeGarbageClass": {
            "input": {
                "type": "string"
            },
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "http://localhost:3000/container/1/changeGarbageClass",
                    "contentType": "application/json"
                }
            ]
        }
    },
    "events": {
        "fire": {
            "title": "fire",
            "description": "Triggers when there is a fire in the container",
            "forms": [
                {
                    "op": [ "subscribeevent", "unsubscribeevent" ],
                    "href": "http://localhost:3000/fire",
                    //sse(?)
                }
            ]
        }
    },
    "links": [
        
    ]
}

module.exports = td;