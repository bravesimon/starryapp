// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');

const retrievedValue = document.getElementById('valueContainer');
const latestValueSent = document.getElementById('valueSent');
const bleStateContainer = document.getElementById('bleState');
const timestampContainer = document.getElementById('timestamp');


// BLE defines
var bleService =        '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';


//Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()){
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log("Web Bluetooth API is not available in this browser!");
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

// Connect to BLE Device and Enable Notifications
async function connectToDevice() {
    try {
        console.log('Initializing Bluetooth...');

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [bleService] }],
            optionalServices: [bleService],
            // acceptAllDevices: true
        });

        console.log('requestDevice finished, device selected:', device.name);
        bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        bleStateContainer.style.color = "#24af37";
        // Add an event listener to detect when a device disconnects
        device.addEventListener('gattservicedisconnected', onDisconnected);

        // Try to connect to the remote GATT Server running on the Bluetooth device
        const server = await device.gatt.connect();
        console.log("ble server created");
        bleServer = server;

        // Get the service from the Bluetooth device
        const service = await server.getPrimaryService(bleService);
        console.log("got primary service");
        bleServiceFound = service;

        // Get the characteristic from the Bluetooth device
        const characteristic = await service.getCharacteristic(bleCharacteristic);
        console.log("got charachteristic");
        sensorCharacteristicFound = characteristic;

    } catch (error) {
        console.log("error", error);
        onError(error)
    }
}

function onDisconnected(event){
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";
}

function writeOnCharacteristic(value){
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(bleCharacteristic)
        .then(characteristic => {
            // console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint8Array([value]);
            return characteristic.writeValue(data);
        })
        .catch(error => {
            console.error("Error writing to the LED characteristic: ", error);
        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        if (sensorCharacteristicFound) {
            sensorCharacteristicFound.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                    return bleServer.disconnect();
                })
                .then(() => {
                    console.log("Device Disconnected");
                    bleStateContainer.innerHTML = "Device Disconnected";
                    bleStateContainer.style.color = "#d13a30";

                })
                .catch(error => {
                    console.log("An error occurred:", error);
                });
        } else {
            console.log("No characteristic found to disconnect.");
        }
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}

// event handling for inputs
const radios = document.querySelectorAll('input');

radios.forEach(radio => {
radio.addEventListener('change', () => {
        console.log(`Sent: ${radio.value}`);

        writeOnCharacteristic(radio.value);
    });
});