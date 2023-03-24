# Bus Rider

## Overview

---

An Electron desktop app which allows the user to publish key/value Kafka messages for the purpose of testing Kafka consumers and producers without the need for costly licenses to use third-party applications. Supports producing and consuming non-keyed messages.

#### Documentation:

## Running the Application

---

`npm run start`

Debugging can be done within the application using the Chromium Developer Tools by pressing `Ctrl+Shift+i` or `F12`

## Building the ZIP Archive

---

`npm run make --targets @electron-forge/maker-zip`

## Install the Desktop Application

---

Unzip in the desired location

## Using the Application

---

### Requirements

-   Windows OS
-   VPN Connection
-   Kafka Cluster access credentials

### Setup

Upon opening the Kafkatizer, the user is greeted with the settings configuration. Here, the user is required to provide the following:

-   Group ID for consuming messages
-   Bootstrap Server (currently only supports entering one server URL)
-   Username to connect to Kafka cluster
-   Password for Kafka cluster
-   Connection Timeout to set the number of milliseconds to wait for a successful connection. Helpful for slower connections.

When the user clicks Connect the setup information is saved in a config.json file in the user's AppData/Roaming folder (C:\Users\\$USERNAME\AppData\Roaming\bus-rider) and the application will attempt the connection.
The settings can be updated at any time by clicking the settings icon ![icon](assets/gear.png).

### Consuming Messages

Once connected, a user can consume messages on a given topic by entering the topic name in the input field. A list of available topics will filter based upon the user's input of at least three characters.

Once consuming begins, the messages will appear in the Messages window with the most-recent message appearing first.

### Producing Messages

Once connected, a user can produce messages on a given topic by entering the topic name in the input field. A list of available topics will filter based upon the user's input of at least three characters.
