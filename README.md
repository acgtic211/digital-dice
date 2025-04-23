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
To install Digital Dice, you need to have the following software installed:
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

After adjusting the parameters, you can run the following command to deploy the database:
```bash
sh init-db.yaml
```

This command will create a MongoDB database with the name `dd-db` and the user `dd_admin` with the password `123456admin`. 

> [!NOTE]
> For access to the database is not required for the normal operation of the system, but if you want to access the database, you can use the following command:
> ```bash
> kubectl port-forward svc/mongo-headless 27018:27017
> ```
> This command will forward the port 27018 of your local machine to the port 27017 of the MongoDB service. > You can then access the database using the program of your choice, such as MongoDB Compass or DataGrip.

## Usage


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