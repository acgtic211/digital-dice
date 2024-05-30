var td = {
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "id": "acg:lab:suitcase-dd",
    "title": "ACG Lab Digital Dice Suitcase",
    "@type": "suitcase",
    "base":"https://acg.ual.es/things",
    "securityDefinitions": {
        "basic_sc": {
            "scheme": "nosec"
        }
    },
    "security": [
        "nosec"
    ],
    "properties": {
        "status-light1": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "boolean",
                }
            },
            "required": [
                "value",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-light1/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-light1/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        },
        "status-light2": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "boolean",
                }
            },
            "required": [
                "value",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-light2/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-light2/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        },
        "status-fire": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "boolean",
                }
            },
            "required": [
                "value",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-fire/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-fire/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        },
        "status-water": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "boolean",
                }
            },
            "required": [
                "value",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-water/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/status-water/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        },
        "luminosity-dimmer1": {
            "type": "object",
            "properties": {
                "brightness": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 100
                }
            },
            "required": [
                "brightness",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/luminosity-dimmer1/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/luminosity-dimmer1/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        },
        "luminosity-dimmer2": {
            "type": "object",
            "properties": {
                "brightness": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 100
                }
            },
            "required": [
                "brightness",
            ],
            "forms": [{
                "op": [
                    "readproperty",
                    "writeproperty"
                ],
                "href": "#/acg:lab:suitcase-dd/property/luminosity-dimmer2/",
                "contentType": "application/json"
            },
            {
                "op": [
                    "readproperty",
                ],
                "href": "#/acg:lab:suitcase-dd/property/luminosity-dimmer2/sse",
                "subprotocol": "sse",
                "response": { "contentType": "text/event-stream" }
            }]
        }
    },
    "actions": {
        "switch-light1": {
            "input": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "boolean",
                    }
                },
            },
            "required": [
                "value",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-light1/",
                "contentType": "application/json"
            }]
        },
        "switch-light2": {
            "input": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "boolean",
                    }
                },
            },
            "required": [
                "value",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-light2/",
                "contentType": "application/json"
            }]
        },
        "switch-fire": {
            "input": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "boolean",
                    }
                },
            },
            "required": [
                "value",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-fire/",
                "contentType": "application/json"
            }]
        },
        "switch-water": {
            "input": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "boolean",
                    }
                },
            },
            "required": [
                "value",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-water/",
                "contentType": "application/json"
            }]
        },
        "switch-dimmer1": {
            "input": {
                "type": "object",
                "properties": {
                    "brightness": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 100
                    }
                },
            },
            "required": [
                "brightness",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-dimmer1/",
                "contentType": "application/json"
            }]
        },
        "switch-dimmer2": {
            "input": {
                "type": "object",
                "properties": {
                    "brightness": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 100
                    }
                },
            },
            "required": [
                "brightness",
            ],
            "forms": [{
                "href": "#/acg:lab:suitcase-dd/action/switch-dimmer2/",
                "contentType": "application/json"
            }]
        }
    }
}
module.exports = td;