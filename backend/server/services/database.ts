import pg from "pg";

const pool = new pg.Pool({
    connectionString: "postgres://postgres:password@127.0.0.1:5432/codechat_api_v1?schema=public",
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

export async function saveThreadAssociation(keyRemoteJid: string, threadId: string) {
    await pool.query(
        "INSERT INTO chat_thread_associations (key_remote_jid, thread_id) VALUES ($1, $2)",
        [keyRemoteJid, threadId]
    );
}

export async function saveSmartWalletAssociation(
    keyRemoteJid: string, 
    threadId: string, 
    walletAddress: string
): Promise<void> {
    const query = `
        INSERT INTO smart_wallet_associations (thread_id, key_remote_jid, wallet_address)
        VALUES ($1, $2, $3)
    `;
    await pool.query(query, [threadId, keyRemoteJid, walletAddress]);
} 