# Digital Dice

[![License MIT](https://img.shields.io/badge/License-MIT-lightgreen.svg)](https://opensource.org/licenses/MIT)

### Table of contents
**[Introduction](#introduction)**<br>
**[Main features](#main-features)**<br>
**[Installation](#installation)**<br>
**[Usage](#usage)**<br>
**[License](#license)**<br>

## Introduction
Digital Dice is a microservice-based architecture that enables the virtual representation of physical devices —such as IoT devices or Cyber-Physical Systems (CPS)— to improve their integration, interoperability, and scalability. As the number of connected devices increases exponentially and the diversity of communication protocols becomes overwhelming, Digital Dice abstracts these complexities, providing a unified interface for users and developers.

This approach aligns with the Web of Things (WoT) principles from the W3C and is designed to simplify development, improve performance under load, and enable safe testing environments through virtual replicas of physical systems. It provides a standardized, protocol-agnostic solution for modern IoT ecosystems.

## Main features
Digital Dice provides a modular, scalable framework that abstracts the interaction with physical devices through a collection of loosely coupled microservices. It handles communication, data persistence, event processing, and user interaction using RESTful APIs and real-time channels like Server-Sent Events (SSE). Core components like the Controller, Data Handler, and Reflection ensure connectivity, data management, and seamless protocol translation.

Optional modules such as the User Interface, Event Handler, and Virtualizer add support for real-time visual dashboards, advanced event logic, and safe test environments without needing the physical hardware connected. Built-in support for message protocols (like MQTT) and semantic data formats (such as JSON-LD) allows devices to be integrated regardless of their underlying technology.

Digital Dice also supports horizontal scaling and high availability, making it suitable for demanding scenarios like Smart Cities, Industry 4.0, or intelligent manufacturing systems.

## Installation
To install, you need to have the following software installed:
1. Docker.
2. Kubernetes.
3. A bash shell.

After installing the required software, you need to adjust the parameters inside the `src.yaml` file.

The parameters are in the ConfigMap `src-config`. The parameters are:
```yaml
PORT_CONTROLLER: "443" # Port for the controller
PORT2_CONTROLLER: "80" # Alternative port for the controller
PORT_DH: "8063" # Port for the datahandler
PORT_EH: "8064" # Port for the eventhandler
PORT_VIRTUALIZER: "8065" # Port for the virtualizer
DEVICE_URI: "192.168.1.38" # IP address of the device
DH: "https://src-dh-entrypoint" # Datahandler entrypoint
EH: "https://src-eh-entrypoint" # Eventhandler entrypoint
DB_NAME: "dd-db" # Database name
DB_USER: "dd_admin" # Database user
DB_PASS: "123456admin" # Database password
DB_URI: "mongodb://mongo-0.mongo-headless.default:27017,mongo-1.mongo-headless.default:27017,mongo-2.mongo-headless.default:27017/" # Database URI
TD_O_URL: "https://example.com" # URL for the Thing Description
```

> [!NOTE]
> This parameter are example values. You need to adjust them according to your environment. The `DEVICE_URI` parameter is the IP address of the device you want to connect to. The `DB_URI` parameter is the URI of the MongoDB database, but if you user the script, this URI is fine. The `TD_O_URL` parameter is the URL for the Thing Description.

After adjusting the parameters, you can run the following command to deploy the database:
```bash
sh init-db.yaml
```

This command will create a MongoDB database with the name `dd-db` and the user `dd_admin` with the password `123456admin`. You can change the database name, user and password in the `init-db.sh` file, but remember to change the parameters in the `src.yaml` file too.

> [!NOTE]
> For access to the database is not required for the normal operation, but if you want to access the database, you can use the following command:
> ```bash
> kubectl port-forward svc/mongo-headless 27018:27017
> ```
> This command will forward the port 27018 of your local machine to the port 27017 of the MongoDB service. > You can then access the database using the program of your choice, such as MongoDB Compass or DataGrip.


After deploying the database, you can run the following command to deploy the Digital Dice microservices:
```bash
sh init-src.yaml
```

This command will create the following services:
- `src-controller`: The controller service that handles the communication with the devices and the user interface.
- `src-dh`: The data handler service that handles the data from the devices and stores it in the database.
- `src-eh`: The event handler service that handles the events from the devices and stores them in the database.
- `src-virtualizer`: The virtualizer service that handles the virtual devices and stores them in the database.
- `src-ui`: The user interface service that handles the user interaction with the devices and the data.
- `src-reflection`: The reflection service that handles the reflection of the devices and stores them in the database.

> [!NOTE]
> The services will start according to the contents of the Thing Description. `src-controller` and `src-dh` always start, while the other services start based on the Thing Description. If the Thing Description has any events, the `src-eh` service will start. If the Thing Description has specified the value "virtual" in the _@type_ field, the `src-virtualizer` service will start and the `src-reflection` service will not start. If the Thing Description does not specify that it is virtual, the `src-reflection` service will start and the `src-virtualizer` service will not start.

> [!IMPORTANT]
> For delete the services, you can use the following command:
> ```bash
> sh delete-src.yaml
> ```
> This command will delete all the services created by the `init-src.yaml` command.
> You can also delete the database using the following command:
> ```bash
> sh delete-db.yaml
> ```
> This command will delete the MongoDB database created by the `init-db.yaml` command.

For using the Digital Dice microservices, you need to have a client that can send HTTP requests to the services. You can use any HTTP client, such as Postman, curl or Insomnia.

### Creating a Behavior File for the Virtualizer

About virtualizer, it is used to create simulated interaction with the devices. For defining the interaction, you need to create a Behavior File that describes the interaction with the device. 

A behavior file consists of these main sections:

1. Basic Information
    - `thing_id`: Must match the device ID from the Thing Description
    - `timings`: Interval in milliseconds for updating device properties
    - `default_values`: Initial values for all device properties
2. Behavior Rules
    - Array of behavior definitions that determine how properties change over time

### Steps to Create a Behavior File

1. Identify Properties from Thing Description

    - Extract all properties defined in your TD (like temperature, light, motion, etc.)

2. Set Default Values

    - Define initial values for each property

3. Define Behavior Rules
    - For each property, create one or more rules that describe how it changes

4. Choose Behavior Types
    - Use appropriate behavior types based on the property's nature:
        - `distribution`: For random values following statistical distributions
        - `list`: For cycling through predefined values
        - `arithmeticExpression`: For calculating values based on formulas
        - `conditional`: For values based on conditions of other properties

### Example Structure
```json
{
  "thing_id": "your-thing-id-from-td",
  "timings": 5000,
  "default_values": {
    "property1": value1,
    "property2": value2
  },
  "behaviour": [
    {
      "description": "Human-readable explanation",
      "inputs": ["input1"],
      "outputs": ["output1"],
      "behaviorType": {
        // Type-specific configuration
      }
    }
  ]
}
```
### Behavior Types

#### Distribution
For generating random values following statistical distributions:
```json
"distribution": {
  "type": "normal",
  "mean": 21,
  "standard_deviation": 1.5
}
```

#### List
For cycling through predefined values in sequence:
```json
"list": {
  "values": [50, 100, 200, 350, 500, 650, 800],
  "index": 0
}
```

#### Arithmetic Expression
For calculating values using mathematical expressions:
```json
"arithmeticExpression": {
  "eval_exp": "input1 > 0 ? input1 - 0.01 : 0"
}
```

#### Conditional
For setting values based on logical conditions:
```json
"conditional": {
  "eval_exp": "temperature > 35",
  "value": true
}
```

#### Map
For copying or mapping values from one property to another:
```json
"map": {
  "property_path": "sourceProperty",
  "value": "defaultValue"
}
```

### Tips for Creating Effective Behavior Files
1. Match all properties from the Thing Description.
2. Consider relationships between properties (e.g., temperature affecting fire detection).
3. Create realistic patterns (daily cycles, gradual changes, etc.).
4. Include behavior rules for events described in the Thing Description.
5. Test your behavior rules to ensure they produce expected values.

The virtualizer will use this behavior file to simulate a device that responds realistically without requiring actual hardware.

## License
MIT License

Copyright (c) 2024 ACG - Applied Computing Group

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.