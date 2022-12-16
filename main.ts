/**
* MakeCode extension for a microbit Wifi logger 
* which can upload readings to a generic web server (e,g, a Google Sheet) 
* The WiFi handling uses an Espressif ESP8266 / ESP - 01 module
* This extension is based on pxt - esp8266_thingspeak by alankrantas
*/
//% color=#00e43f icon="\uf1eb" block="ESP8266 web logger"
namespace WebLogger {

    let wifi_connected: boolean = false
    let webapp_connected: boolean = false
    let last_upload_successful: boolean = false

    /******************* Functions  **************************/
    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 100) {
        serial.writeString(command + "\u000D\u000A")
        basic.pause(wait)
    }

    // wait for response from ESP8266
    function waitResponse(): boolean {
        let serial_str: string = ""
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            //if (serial_str.length > 200) serial_str = serial_str.substr(serial_str.length - 200)
            if (serial_str.includes("OK")) {
                result = true
                break
            } else if (serial_str.includes("ERROR") || serial_str.includes("SEND FAIL")) {
                break
            }
            if (input.runningTime() - time > 30000) break
        }
        return result
    }

    /**
    * Initialize ESP8266 module and connect it to Wifi router
    */
    //% block="Initialize ESP8266|RX (Tx of micro:bit) %tx|TX (Rx of micro:bit) %rx|Baud rate %baudrate|Wifi SSID = %ssid|Wifi PW = %pw"
    //% tx.defl=SerialPin.P0
    //% rx.defl=SerialPin.P1
    //% ssid.defl=your_ssid
    //% pw.defl=your_pw
    export function connectWifi(tx: SerialPin, rx: SerialPin, baudrate: BaudRate, ssid: string, pw: string) {
        wifi_connected = false
        webapp_connected = false
        serial.redirect(
            tx,
            rx,
            baudrate
        )
        sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+CWMODE=1") // set to STA mode
        sendAT("AT+RST", 1000) // reset
        sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", 0) // connect to Wifi router
        wifi_connected = waitResponse()
        basic.pause(100)
    }

    /**
    * Connect to WebApp and upload data. 
    * It will not upload anything if it failed to connect to Wifi or WebApp.
    */
    //% block="Upload data to WebApp|URL = %url|Field 1 = %n1|Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7|Field 8 = %n8"
    //% ip.defl=api.thingspeak.com
    export function connectWebApp(url: string, n1: number, n2: number, n3: number, n4: number, n5: number, n6: number, n7: number, n8: number) {
        if (wifi_connected) {
            webapp_connected = false
            sendAT("AT+CIPSTART=\"TCP\",\"" + url + "\",80", 0) // connect to website server
            webapp_connected = waitResponse()
            basic.pause(100)
            if (webapp_connected) {
                last_upload_successful = false
                let str: string = "GET" + "&field1=" + n1 + "&field2=" + n2 + "&field3=" + n3 + "&field4=" + n4 + "&field5=" + n5 + "&field6=" + n6 + "&field7=" + n7 + "&field8=" + n8;
                sendAT("AT+CIPSEND=" + (str.length + 2))
                sendAT(str, 0) // upload data
                last_upload_successful = waitResponse()
                basic.pause(100)
            }
        }
    }

    /**
    * Wait between uploads
    */
    //% block="Wait %delay ms"
    //% delay.min=0 delay.defl=5000
    export function wait(delay: number) {
        if (delay > 0) basic.pause(delay)
    }

    /**
    * Check if ESP8266 successfully connected to Wifi
    */
    //% block="Wifi connected ?"
    export function isWifiConnected() {
        return wifi_connected
    }

    /**
    * Check if ESP8266 successfully connected to WebApp
    */
    //% block=WebApp connected ?"
    export function isWebAppConnected() {
        return webapp_connected
    }

    /**
    * Check if ESP8266 successfully uploaded data to WebApp
    */
    //% block="Last data upload successful ?"
    export function isLastUploadSuccessful() {
        return last_upload_successful
    }

}