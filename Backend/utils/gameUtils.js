const { redisClient } = require("../utils/redis"); // Adjust the path to match your folder structure


async function constructPlayerList(roomCode) {
    const player_list = await redisClient.hGetAll(`${roomCode}-List`);
    let player_list_names = []
    for (key in player_list) {
        player_list_names.push(player_list[key]);
    }
    return player_list_names
}


async function constructPlayerOrder(roomCode) {
    const sessionScore = await redisClient.hGetAll(`${roomCode}-Session-Score`);
    const roomHost = await redisClient.hGet(roomCode, "Host");
    const rankListPromises = Object.keys(sessionScore)
        .filter(sessionId => sessionId !== roomHost)
        .map(async (sessionId) => {
            const username = await redisClient.hGet(`${roomCode}-List`, sessionId);
            const playerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, sessionId);
            return {
                playerIndex: parseInt(playerIndex, 10),
                playerName: username || "Anonymous", 
                playerScore: parseInt(sessionScore[sessionId], 10) || 0,
                sessionId: sessionId,
            };
    });
    let rankList = await Promise.all(rankListPromises);
    rankList.sort((a, b) => b.playerScore - a.playerScore);
    return rankList;
}


async function constructRankingList(roomCode) {
    const rankList = await constructPlayerOrder(roomCode);
    let prev = null, fullRankList = {players: []}, rank = 1;
    for (let i = 0; i < rankList.length; i++) {
        const currScore = rankList[i].playerScore;
        if (prev && prev !== currScore) {
            rank++;
        }
        prev = rankList[i].playerScore;
        const { sessionId, ...playerData } = rankList[i];
        const playerRankObject = {
            ...playerData,
            playerRank: rank
        };
        fullRankList.players.push(playerRankObject);
    }
    return fullRankList;
}

module.exports = {
    constructPlayerList,
    constructRankingList,
    constructPlayerOrder
};