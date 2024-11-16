CREATE TABLE chat_thread_associations (
    key_remote_jid VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255) NOT NULL
);

CREATE TABLE blacklist (
    thread_id VARCHAR(255) PRIMARY KEY,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE smart_wallet_associations (
    thread_id VARCHAR(255) PRIMARY KEY,
    key_remote_jid VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL
);
