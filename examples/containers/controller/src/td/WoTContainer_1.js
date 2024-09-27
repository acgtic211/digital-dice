var td = {
    "@context": "https://www.w3.org/2019/wot/td/v1",

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
        "containerDetails": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "object",
                    "properties": {
                        "lat": {
                            "type": "string"
                        },
                        "lng": {
                            "type": "string"
                        }
                    }
                },
                "totalCapacity": {
                    "type": "number",
                    "min": 0
                },
                "capacity": {
                    "type": "number",
                    "min": 0
                },
                "garbageClass": {
                    "type": "string"
                },
                "temperature": {
                    "type": "number"
                },
                "serialNumber": {
                    "type": "number",
                    "min": 0
                },
                "address": {
                    "type": "string"
                }
            },
            "uriVariables": {
                "serialNumber": { "type": "number" }
            },
            "forms": [
                {
                    "op": "readproperty",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/{?serialNumber}/property/containerDetails",
                    "contentType": "application/json"
                }
            ]
        },
        "containersDetails": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "object",
                        "properties": {
                            "lat": {
                                "type": "string"
                            },
                            "lng": {
                                "type": "string"
                            }
                        }
                    },
                    "totalCapacity": {
                        "type": "number"
                    },
                    "capacity": {
                        "type": "number"
                    },
                    "garbageClass": {
                        "type": "string"
                    },
                    "temperature": {
                        "type": "number"
                    },
                    "serialNumber": {
                        "type": "number",
                        "min": 0
                    },
                    "address": {
                        "type": "string"
                    }
                }
            },
            "forms": [
                {
                    "op": "readproperty",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/property/containersDetails",
                    "contentType": "application/json"
                }
            ]
        }
    },
    "actions": {
        "emptyContainer": {
            "title": "Empty container",
            "description": "Garbage is collected, emptying the container",
            "uriVariables": {
                "serialNumber": { "type": "number" }
            },  
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/{?serialNumber}/actions/emptyContainer",
                    "contentType": "application/json"
                }
            ]
        },
        "throwGarbage": {
            "inputs": {
                "type": "object",
                "properties": {
                    "capacity": {
                        "type": "number"
                    }
                }
            },
            "required": [
                "capacity"
            ],
            "uriVariables": {
                "serialNumber": { "type": "number" }
            }, 
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/{?serialNumber}/actions/throwGarbage",
                    "contentType": "application/json"
                }
            ]
        },
        "changeTemperature": {
            "inputs": {
                "type": "object",
                "properties": {
                    "temperature": {
                        "type": "number"
                    }
                }
            },
            "required": [
                "temperature"
            ],
            "uriVariables": {
                "serialNumber": { "type": "number" }
            }, 
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/{?serialNumber}/actions/changeTemperature",
                    "contentType": "application/json"
                }
            ]
        },
        "moveContainer": {
            "inputs": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "object",
                        "properties": {
                            "lat": {
                                "type": "string"
                            },
                            "lng": {
                                "type": "string"
                            }
                        }
                    }
                }
            },
            "required": [
                "location"
            ],
            "uriVariables": {
                "serialNumber": { "type": "number" }
            }, 
            "forms": [
                {
                    "op": "invokeaction",
                    "href": "https://dd-garbage-containers-controller:443/acg:lab:virtual-containers/{?serialNumber}/actions/changeLocation",
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
                    "href": "https://dd-garbage-containers-controller-entrypoint:443/acg:lab:virtual-containers/events/fire/sse",
                    "subprotocol": "sse",
                    "response": { "contentType": "text/event-stream" }
                }
            ]
        },
        "garbageCollected": {
            "title": "Garbage collected",
            "description": "Triggers when the container´s garbage is collected by a truck",
            "data": {

            },
            "forms": [
                {
                    "op": [ "subscribeevent", "unsubscribeevent" ],
                    "href": "https://dd-garbage-containers-controller-entrypoint:443/acg:lab:virtual-containers/events/garbageCollected/sse",
                    "subprotocol": "sse",
                    "response": { "contentType": "text/event-stream" }
                }
            ]
        }
    },
    "links": [
        
    ]
}


module.exports = td;