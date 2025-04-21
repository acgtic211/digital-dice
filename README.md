# Digital Dice

## Table of contents
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