#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "OnePlus Nord CE 3 Lite 5G";
const char* password = "yogi0406";

// Backend server configuration
const char* serverBaseURL = "http://192.168.1.100:3000"; // Change to your server IP
const char* httpServerURL = "http://192.168.1.100:3000/api/access/request";
const char* wsServerURL = "192.168.1.100"; // WebSocket server (no http://)

// RFID Setup
#define SS_PIN 5
#define RST_PIN 0
MFRC522 rfid(SS_PIN, RST_PIN);

// Keypad/Button setup for node selection
const int numButtons = 8;
const int buttonPins[numButtons] = {12, 13, 14, 15, 16, 17, 18, 19};
String nodeIDs[numButtons] = {
  "LKR_001", "LKR_002", "LKR_003", "LKR_004", 
  "LKR_005", "LKR_006", "DBIN_001", "DBIN_002"
};

// LCD Display
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

// WebSocket client
WebSocketsClient webSocket;

String currentRFID = "";
int selectedNodeIndex = -1;
bool wsConnected = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000;

void setup() {
  Serial.begin(115200);
  
  // Initialize RFID
  SPI.begin();
  rfid.PCD_Init();
  
  // Initialize buttons
  for (int i = 0; i < numButtons; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RFID System Ready");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize WebSocket
  setupWebSocket();
}
void setupWebSocket() {
  webSocket.begin(wsServerURL, 3000, "/");
  webSocket.onEvent(webSocketEvent);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket connected");
      break;
    case WStype_TEXT:
      Serial.println("WebSocket message: " + String((char*)payload));
      break;
  }
}

void sendNodeStatusUpdate(String nodeId, String status) {
  String message = "{\"type\":\"nodeStatusUpdate\",\"nodeId\":\"" + nodeId + "\",\"status\":\"" + status + "\"}";
  webSocket.sendTXT(message);
}

void loop() {
  // Maintain WebSocket connection
  webSocket.loop();
  
  // Check for RFID card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    readRFID();
  }
  
  // Check for node selection
  checkNodeSelection();
  
  // Handle WebSocket reconnection
  if (!wsConnected && millis() - lastReconnectAttempt > RECONNECT_INTERVAL) {
    setupWebSocket();
    lastReconnectAttempt = millis();
  }
  
  delay(100);
}

void setupWebSocket() {
  // WebSocket connection
  webSocket.begin(wsServerURL, 3000, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println("🔌 Attempting WebSocket connection...");
  lcd.setCursor(0, 1);
  lcd.print("WS: Connecting...");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("🔌 WebSocket disconnected");
      wsConnected = false;
      lcd.setCursor(0, 1);
      lcd.print("WS: Disconnected  ");
      break;
      
    case WStype_CONNECTED:
      Serial.println("✅ WebSocket connected");
      wsConnected = true;
      lcd.setCursor(0, 1);
      lcd.print("WS: Connected     ");
      
      // Register this controller with the server
      sendControllerRegister();
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("💥 WebSocket error");
      wsConnected = false;
      break;
  }
}

void handleWebSocketMessage(char* payload) {
  Serial.println("📨 WebSocket message: " + String(payload));
  
  // Parse JSON message
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.println("❌ JSON parse error: " + String(error.c_str()));
    return;
  }
  
  String messageType = doc["type"] | "unknown";
  
  if (messageType == "nodeStatusUpdate") {
    String nodeId = doc["nodeId"] | "";
    String status = doc["status"] | "";
    Serial.println("🔄 Server status update: " + nodeId + " -> " + status);
  }
  else if (messageType == "accessEvent") {
    String rfid = doc["rfid"] | "";
    String node = doc["node"] | "";
    bool accessGranted = doc["access_granted"] | false;
    Serial.println("🔓 Access event: " + rfid + " -> " + node + " = " + String(accessGranted));
  }
}

void sendControllerRegister() {
  DynamicJsonDocument doc(512);
  doc["type"] = "controllerRegister";
  doc["controllerId"] = "MAIN_CONTROLLER_01";
  doc["firmwareVersion"] = "2.0.0";
  doc["nodes"] = "LKR_001,LKR_002,LKR_003,LKR_004,LKR_005,LKR_006,DBIN_001,DBIN_002";
  
  String message;
  serializeJson(doc, message);
  webSocket.sendTXT(message);
  Serial.println("🎛️ Controller registered with server");
}

void sendNodeStatusUpdate(String nodeId, String status) {
  if (!wsConnected) {
    Serial.println("⚠️ WebSocket not connected, skipping status update");
    return;
  }
  
  DynamicJsonDocument doc(512);
  doc["type"] = "nodeStatusUpdate";
  doc["nodeId"] = nodeId;
  doc["status"] = status;
  doc["timestamp"] = getTimestamp();
  doc["controllerId"] = "MAIN_CONTROLLER_01";
  
  String message;
  serializeJson(doc, message);
  webSocket.sendTXT(message);
  Serial.println("📤 Status update sent: " + nodeId + " -> " + status);
}

void readRFID() {
  String rfidUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    rfidUid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    rfidUid += String(rfid.uid.uidByte[i], HEX);
  }
  rfidUid.toUpperCase();
  
  currentRFID = rfidUid;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID: " + rfidUid);
  lcd.setCursor(0, 1);
  lcd.print("Select Node      ");
  
  Serial.println("📟 RFID Scanned: " + rfidUid);
  
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void checkNodeSelection() {
  for (int i = 0; i < numButtons; i++) {
    if (digitalRead(buttonPins[i]) == LOW) {
      selectedNodeIndex = i;
      handleAccessRequest();
      delay(500); // Debounce
      break;
    }
  }
}

void handleAccessRequest() {
  if (currentRFID == "" || selectedNodeIndex == -1) {
    return;
  }
  
  String nodeID = nodeIDs[selectedNodeIndex];
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Processing...    ");
  lcd.setCursor(0, 1);
  lcd.print("Node: " + nodeID);
  
  // Send WebSocket access event (non-blocking)
  sendAccessEvent(currentRFID, nodeID);
  
  // Use HTTP for the actual access request (reliable)
  sendHTTPAccessRequest(currentRFID, nodeID);
}

void sendAccessEvent(String rfidUid, String nodeId) {
  if (!wsConnected) {
    Serial.println("⚠️ WebSocket not connected, skipping access event");
    return;
  }
  
  DynamicJsonDocument doc(512);
  doc["type"] = "accessEvent";
  doc["rfid"] = rfidUid;
  doc["node"] = nodeId;
  doc["timestamp"] = getTimestamp();
  doc["controllerId"] = "MAIN_CONTROLLER_01";
  
  String message;
  serializeJson(doc, message);
  webSocket.sendTXT(message);
  Serial.println("📤 Access event sent via WebSocket");
}

void sendHTTPAccessRequest(String rfidUid, String nodeId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(httpServerURL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    DynamicJsonDocument doc(512);
    doc["rfid_uid"] = rfidUid;
    doc["requested_node_id"] = nodeId;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    Serial.println("📡 Sending HTTP request: " + jsonPayload);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("✅ HTTP Response: " + response);
      
      // Parse JSON response
      DynamicJsonDocument resDoc(1024);
      DeserializationError error = deserializeJson(resDoc, response);
      
      if (!error) {
        bool accessGranted = resDoc["access_granted"] | false;
        String userName = resDoc["user"] | "Unknown";
        String message = resDoc["message"] | "";
        
        if (accessGranted) {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("ACCESS GRANTED   ");
          lcd.setCursor(0, 1);
          lcd.print("User: " + userName);
          
          // Send status update via WebSocket
          sendNodeStatusUpdate(nodeId, "occupied");
          
          // Trigger unlock mechanism
          unlockNode(selectedNodeIndex);
        } else {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("ACCESS DENIED    ");
          String reason = resDoc["reason"] | "";
          if (reason != "") {
            lcd.setCursor(0, 1);
            lcd.print(reason.substring(0, 16));
          }
        }
      } else {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("JSON Parse Error ");
        Serial.println("❌ JSON parse error in response");
      }
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Server Error     ");
      lcd.setCursor(0, 1);
      lcd.print("Code: " + String(httpResponseCode));
      Serial.println("❌ HTTP Error: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Disconnected");
    connectToWiFi();
  }
  
  // Reset for next operation
  delay(3000);
  currentRFID = "";
  selectedNodeIndex = -1;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan RFID Card   ");
  if (wsConnected) {
    lcd.setCursor(0, 1);
    lcd.print("WS: Connected    ");
  } else {
    lcd.setCursor(0, 1);
    lcd.print("WS: Disconnected ");
  }
}

void unlockNode(int nodeIndex) {
  String nodeID = nodeIDs[nodeIndex];
  Serial.println("🔓 Unlocking: " + nodeID);
  
  // Example: Trigger relay for specific node
  int unlockPin = 21 + nodeIndex; // Assign pins for each node
  pinMode(unlockPin, OUTPUT);
  digitalWrite(unlockPin, HIGH);
  delay(2000); // Keep unlocked for 2 seconds
  digitalWrite(unlockPin, LOW);
  
  Serial.println("🔒 Relocked: " + nodeID);
}

String getTimestamp() {
  // Simple timestamp (you can add RTC for actual time)
  return String(millis());
}

void connectToWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi ");
  
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected   ");
    lcd.setCursor(0, 1);
    lcd.print("IP: " + WiFi.localIP().toString().substring(0, 15));
    delay(2000);
    
    Serial.println("✅ Connected to WiFi");
    Serial.println("IP Address: " + WiFi.localIP().toString());
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed     ");
    Serial.println("❌ WiFi connection failed");
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan RFID Card   ");
}