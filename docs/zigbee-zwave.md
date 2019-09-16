# Zigbee/Zwave/Lutron

The way to interact with devices that use this protocol depends on the gateway device used to oversee them. The following documents tries to do a quick technical report on the gatewat Wink Hub 2 for Zigbee, Zwave or Lutron devices.

The Wink API connects Wink devices to users, apps, each other, and the wider web. This API offer its functionality as a RESTful API, in the next section we are going to talk about the main aspects of how to use this API.

## Quick-glance (important aspects)

### Authentication
Nearly every request to the Wink API requires an OAuth bearer token.

### Content-Types
* Nearly every request to the Wink API should be expressed as JSON.
* Nearly every response from the Wink API will be expressed as JSON.
### Http-Verbs
The Wink API uses HTTP verbs in pretty standard ways:
* GET for retrieving information without side-effects.
* PUT for updating existing resources, with partial-update semantics supported.
* POST for creating new resources or blind upserts of existing resources.
* DELETE for destructive operations on existing resurces.

### Indentifiers
All objects in the Wink API can be identified by object_type and object_id. The object_id is a string and not globally unique, currently. That is there can be an `'object_type':'light_bulb'` and `'object_id':'abc'` and an `'object_type':'thermostat'` and `'object_id':'abc'`.

### Creatable vs. permanent

* The term "creatable" will describe a resource which may be created and/or destroyed by the user.
* The term "permanent" will describe a resource which may not be directly created or deleted by a user.

### Mutable vs. Immutable

* The term "mutable" will describe a resource or attribute which the user may modify at will, assuming the user has the necessary permissions to do so.
* The term "immutable" will describe a resouce or attribute which may not be modified directly by the user.

### Error states
The common [HTTP Response Status Codes](https://github.com/for-GET/know-your-http-well/blob/master/status-codes.md) are used.

### Subscriptions

Real-time updates through the Wink API are managed by PubNub.

Subscriptions are organized around "topics". Subscriptions to topics fall into two categories: Lists and Objects.

* List subscriptions send updates when an object is added or removed from the list. For example, a subscription to `/users/me/wink_devices` would trigger an update when a new device is added to a user account.
* Object subscriptions send updates when an object is updated in any way. For example, a subscription to `/light_bulbs/abc` would trigger an update when a light bulb goes from powered off to powered on. Several changes may be aggregated into a single broadcast, when the changes have happened in rapid succession.
  
To subscribe to a topic, find the subscription object inside the response from a GET request to either a list or an object.

## Devices

In this section we are going to take a glance to the model that depicts and object with the Wink API.

### Common patterns and fields of Wink API Devices

Specific fields, particularly in desired_state and last_reading will be outlined in the object-specific sections. Each Wink Device can have the following attributes, but not all attributes will be populated. Prepare to receive null for any one of these. 

For specific implementations, refer to the device documentation of the given device type.

|API field|Attributes|Description|
| ------- | -------- | -------- |
|object_type|	(string, assigned)|	type of object (NOTE: legacy apps expect a specific type id such as "light_bulb_id")|
|object_id|	(string, assigned)	|id of object (NOTE: legacy apps expect a specific type id such as "light_bulb_id")|
|name	|(String, writable)	|Name of the device, default given by server upon provisioning but can be updated by user|
|locale|	(String, format LL_CC -- "en_us", "fr_fr")	|Can be updated by user, but not exposed in the app, usually based of user's locale
|units|	(object, specific to device)|
|created_at|	(long, timestamp, immutable)|	Time device was added to account
|subscription|	(pubnub subscription object)|
|manufacturer_device_model|	(String, assigned)	|snaked case, unique device model
|manufatcurer_device_id|	(String, assigned)|	udid of third party device in third party system
|hub_id	|(String, assigned)	|id of hub associated with device, only for devices with hub
|local_id|	(String, assigned)	|id of device on hub, only for devices with hub
|radio_type|	(String, assigned)|	currently only for devices with hub, available values "zigbee", "zwave", "lutron", "wink_project_one"
|device_manufacturer|	(String, assigned)	| Human readable display string of manufacturer
|lat_lng|	(tuple of floats, writable)|	location of device
|location|	(String, writable)|	pretty printable location of device
|desired_state|	(object, values of requested state)|	Depends on object type
|last_reading|	(object, values of last reading from device)|	Depends on object type
|capabilities|	(object, specific capabilities of this object)	|for instance for sensor the last_reading values available

### Capabilities

The API sets capabilities for devices to indicate whether a field is present, whether it is mutable and what are the allowed values.

The power of capabilities allow for devices with different attributes to have the same object type. An example is using capabilties to distinguish a light bulb that has only has dimming capabilites from a light bulb that has dimming and color changing capabilities.

Capabilities currently contains one object fields, an array object of field capabilities.

### Desired State and Last Reading
The `desired_state`/`last_reading` paradigm is available in almost all wink devices. Fields in desired_state are what the client requests the state of the device to be, whereas fields in `last_reading` are what the API believes to be the current state of things.

When the device acknowledges that the state has been applied, the server will clear the field from `desired_state`. Then `last_reading.x`, `last_reading.x_updated_at` and `last_reading.x_changed_at` will update appropriately.

If a device fails to change to the `desired_state`, likely due to a failure of some kind including the device being offline, the server will give up after 2 minutes and clear `desired_state`. Only `last_reading.x_updated_at` would update in that case as there was no change to the actual reading.

### Examples of use of wink API

1. To obtain an access token. `[POST]https://api.wink.com/oauth2/token`

Body
```Javascript
{
    "client_secret": "client_secret_goes_here",
    "grant_type": "authorization_code",
    "code": "code_from_redirect_to_your_provided_redirect_uri"
}
```

Response
```Javascript
{
  "data": {
    "access_token": "example_access_token_like_135fhn80w35hynainrsg0q824hyn",
    "refresh_token": "crazy_token_like_240qhn16hwrnga05euynaoeiyhw52_goes_here",
    "token_type": "bearer"
  }
}
```

2. Retrieve all the devices of a user. `[GET]https://api.wink.com/users/me/wink_devices`

Response
```Javascript
{
    "data":[{
        "object_id":"27105",
        "object_type":"light_bulb",
        "locale":"Lighty Light",
        "manufacturer_device_model":"ge_light_bulb",
        "manufatcurer_device_id":"123456",
        "hub_id":"rtyui",
        "local_id":"5",
        "radio_type":"zigbee",
        "device_manufacturer":"GE",
        "subscription": {
            "pubnub": {
                "subscribe_key": "worghwihr0aijyp5ejhapethnpaethn",
                "channel": "w0y8hq03hy5naeorihnse05iyjse5yijsm"
            }
        }
        "locale":"en_us",
        "units":{
        },
        "lat_lng":[],
        "desired_state":{},
        "last_reading":{},
        "capabilities":{},
        "created_at":1234567890,
    }],
    "errors":[
    ],
    "pagination":{
    }
}
```
3. Update desired_state of a lightbulb. `[PUT]https://api.wink.com/device_type/device_id/desired_state`.
Body
```Javascript
{
    "desired_state": {
    "powered": true
    }
}
```

## Example of desired_state/lastreading attributes of Air Conditioner

#### Desired State Attributes
|API field	|Attributes	|Description|
|---|---|---|
|fan_speed|	float|	0 - 1|
|mode	|string|	"cool_only", "fan_only", "auto_eco"|
|powered|	boolean|	whether or not the unit is powered on|
|max_set_point|	float	|temperature above which the unit should be cooling

#### Last Reading Attributes

|API field|	Attributes|	Description|
|---|---|---
|connection|	Boolean|	whether or not the device is reachable remotely|
|temperature|	float|	maps to ambient temperature last read from device itself|
|consumption|	float|	total consumption in watts

if you want a thorough understanding of more types of devices please go to the help page of [Wink API](https://winkapiv2.docs.apiary.io/#reference).
