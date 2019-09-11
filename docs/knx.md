# KNX

All the documentation bellow is the documentation established by the knx protocol using knx-inside-mtn6500-0113 gateway making use of a library like [node knx.js](https://www.npmjs.com/package/knx) or [java calimero](https://mvnrepository.com/artifact/com.github.calimero/calimero-core/2.4-rc2).

To use these kinds of devices we have to know the {ip}:{port}/{groupAddress} an the data type acepted by that group.

## Groups Addresses

### Pourpouse

Group Addresses serve the purpose of making Group Objects part of building functions.

In order to be operational, a Group Address has to be linked with at least two Group Objects, one for sending telegrams to the bus and the other for receiving from the bus.

A Group Object can also be linked with several Group Addresses, all linked Group Addresses can be used in order to update the value of the Group Object via the bus (i.e. received telegrams) but only the first one assigned can be used in order to send updated values of the Group Object to the bus.

### Data Length

A Group Address has a data length of 16 bit. In a telegram, a Group Address is divided over two octets, i.e. the high address and the low address. The high address is always sent first.

### Structure (ETS)

The so called Group Address structure correlates with its representation style in ETS, see also the relevant ETS Professional article. The information about the ETS Group Address representation style itself is NOT included in the Group Address.

1. '3-level' = main/middle/sub
   * main = D7+D6+D5+D4+D3 of the first octet (high address)
   * middle = D2+D1+D0 of the first octet (high address)
   * sub = the entire second octet (low address)
   * ranges: main = 0..31, middle = 0..7, sub = 0..255
2. '2-level' = main/sub
   * main = D7+D6+D5+D4+D3 of the first octet (high address)
   * sub = D2+D1+D0 of the first octet (high address) + the entire second octet (low address)
   * ranges: main = 0..31, sub = 0..2047

### Rules

There is actually only one rule: a Group Address cannot be zero. For an ETS project with 3-level representation this means that '0/0/0' is not allowed and for 2-level that '0/0' is not allowed.

### Limitations

First generation devices didn't support the full 16-bit Group Address range, i.e. D7 = 0, the consequence for an ETS project with 2 or 3-level representation: the range of 'main' = 0..15.

## Datapoint Type

Every Group Object is in fact a data point, i.e. it represents data.

In order to have a standardized interpretation of the data represented by each Group Object, data point types have been introduced.

E.g. suppose that a telegram is sent to a binary actuator in order to switch on a light somewhere in the building. Taking a closer look at this sentence two aspects can be distinguished:

* 'somewhere in the building'
* 'switch on'

The 'somewhere in the building' part is represented by the destination address of the telegram, i.e. the Group Address.

The 'switch on' part is at this moment unclear: it is not really certain how 'on' is encoded, i.e. without further knowledge only assumptions can be made and this is the reason why Datapoint Types are required.

### Group Object 'configuration'

As such a Datapoint Type is a defined as being part of the Group Object configuration.

HOWEVER, the actual Datapoint Type information:

is not stored in device memory
is never included in a telegram
is only stored in the ETS project
Datapoint Types are especially important for diagnostics, i.e. to enable ETS monitor interpreting data associated with Group Objects, e.g. instead of 'data = 85 A8', 'data = -6 °C' is shown.

### Structure & notation

1. Structure:

    * data type: format + encoding
    * size: value range + unit

2. Notation: X.YYY

    * X: defines format + encoding
    * YYY: defines value range + unit

### Datatypes supported by Calimero

* 1.x - Boolean, e.g., Switch, Alarm
* 2.x - Boolean controlled, e.g., Switch Controlled, Enable Controlled
* 3.x - 3 Bit controlled, e.g., Dimming, Blinds
* 5.x - 8 Bit unsigned value, e.g., Scaling, Tariff information
* 6.x - 8 Bit signed value, e.g., Percent (8 Bit), Status with mode
* 7.x - 2 octet unsigned value, e.g., Unsigned count, Time period
* 9.x - 2 octet float value, e.g., Temperature, Humidity
* 10.x - Time
* 11.x - Date
* 12.x - 4 octet unsigned value
* 13.x - 4 octet signed value, e.g., Counter pulses, Active Energy
* 14.x - 4 octet float value, e.g., Acceleration, Electric charge
* 16.x - String, e.g., ASCII string, ISO-8859-1 string (Latin 1)
* 17.x - Scene number
* 18.x - Scene control
* 19.x - Date with time
* 20.x - 8 Bit enumeration, e.g., Occupancy Mode, Blinds Control Mode
* 21.x - Bit array of length 8, e.g., General Status, Room Heating Controller Status
* 22.x - Bit array of length 16, implemented are DPT 22.101 and DPT 22.1000
* 28.x - UTF-8 string
* 29.x - 64 Bit signed value, e.g., Active Energy, Apparent energy
* 229.001 - M-Bus metering value, with the various M-Bus VIF/VIFE codings
* 232.x - RGB color value