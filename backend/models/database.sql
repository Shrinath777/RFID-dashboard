CREATE DATABASE IF NOT EXISTS rfid_access_system;
USE rfid_access_system;

-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    rfid_uid VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nodes table
CREATE TABLE nodes (
    node_id VARCHAR(20) PRIMARY KEY,
    location VARCHAR(100),
    type ENUM('locker', 'dustbin') NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-node permissions
CREATE TABLE user_node_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    node_id VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
    UNIQUE KEY unique_permission (user_id, node_id)
);

-- Access logs
CREATE TABLE access_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    node_id VARCHAR(20),
    action ENUM('opened', 'closed', 'access_denied') NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_timestamp TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);

-- Insert sample data
INSERT INTO nodes (node_id, location, type) VALUES 
('LKR_001', 'Floor 1 - Corridor A', 'locker'),
('LKR_002', 'Floor 1 - Corridor A', 'locker'),
('LKR_003', 'Floor 2 - Corridor B', 'locker'),
('DBIN_001', 'Floor 1 - Entrance', 'dustbin'),
('DBIN_002', 'Floor 2 - Common Area', 'dustbin');

INSERT INTO users (name, email, rfid_uid) VALUES 
('John Doe', 'john@email.com', 'A1B2C3D4E5'),
('Jane Smith', 'jane@email.com', 'F6G7H8I9J0');

INSERT INTO user_node_permissions (user_id, node_id) VALUES 
(1, 'LKR_001'),
(1, 'LKR_002'),
(2, 'LKR_003'),
(1, 'DBIN_001'),
(2, 'DBIN_002');
ALTER TABLE nodes ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;