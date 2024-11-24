import pg from "pg";

const pool = new pg.Pool({
    connectionString: "postgres://postgres:password@postgres/codechat_api_v1?schema=public",
});

export async function checkBlacklist(threadId: string) {
    const blacklistCheckResult = await pool.query(
        "SELECT thread_id, blacklisted_at FROM blacklist WHERE thread_id = $1",
        [threadId]
    );
    return blacklistCheckResult;
}

export async function removeFromBlacklist(threadId: string) {
    await pool.query("DELETE FROM blacklist WHERE thread_id = $1", [threadId]);
}

export async function addToBlacklist(threadId: string) {
    await pool.query("INSERT INTO blacklist (thread_id) VALUES ($1)", [threadId]);
}

export async function getThreadId(keyRemoteJid: string) {
    return await pool.query(
        "SELECT thread_id FROM chat_thread_associations WHERE key_remote_jid = $1",
        [keyRemoteJid]
    );
}

export async function getSmartWalletAssociation(threadId: string) {
    return await pool.query(
        "SELECT wallet_address, private_key FROM smart_wallet_associations WHERE thread_id = $1",
        [threadId]
    );
}

export async function saveThreadAssociation(keyRemoteJid: string, threadId: string) {
    await pool.query(
        "INSERT INTO chat_thread_associations (key_remote_jid, thread_id) VALUES ($1, $2)",
        [keyRemoteJid, threadId]
    );
}

export async function saveSmartWalletAssociation(
    keyRemoteJid: string, 
    threadId: string, 
    walletAddress: string,
    privateKey: string
): Promise<void> {
    const query = `
        INSERT INTO smart_wallet_associations (thread_id, key_remote_jid, wallet_address, private_key)
        VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [threadId, keyRemoteJid, walletAddress, privateKey]);   
} 