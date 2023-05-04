const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let db = null;
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running AT: http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const snakeCaseToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayer = `
     SELECT 
     *
     FROM 
     player_details;    
`;
  const camelCase = [];
  const playerResponse = await db.all(getAllPlayer);
  const passingToCamelCase = playerResponse.map((eachPlayer) => {
    let update = snakeCaseToCamelCase(eachPlayer);
    camelCase.push(update);
  });
  response.send(camelCase);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
    *
    FROM
    player_details
    WHERE 
    player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayer);
  response.send(snakeCaseToCamelCase(dbResponse));
});

//updating player based on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
   UPDATE 
   player_details
   SET
   player_name = '${playerName}'
   WHERE
   player_id = ${playerId};`;
  const result = await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//getting match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const result = await db.get(getMatchDetails);

  response.send(snakeCaseToCamelCase(result));
});

//getting all matches of a player
const snakeCaseToCamelCase2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatches = `
    SELECT
    *
    FROM
    match_details Natural Join player_match_score
    WHERE
    player_id = ${playerId};`;
  const camelCase = [];
  const result = await db.all(getMatches);
  const updatingDetails = result.map((eachPlayer) => {
    let update = snakeCaseToCamelCase2(eachPlayer);
    camelCase.push(update);
  });
  response.send(camelCase);
});

//getting players of a specific match

const snakeCaseToCamelCase3 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayer = `
    SELECT * FROM player_details Natural Join player_match_score
    WHERE 
    match_id = ${matchId};`;
  const camelCase = [];
  const result = await db.all(getPlayer);
  const updateDetails = result.map((eachPlayer) => {
    let update = snakeCaseToCamelCase3(eachPlayer);
    camelCase.push(update);
  });
  response.send(camelCase);
});

// getting statistics od total score,...etc;
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayers = `
    SELECT player_details.player_id AS playerId, player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM
    player_details Inner Join player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};`;
  const result = await db.get(getPlayers);
  response.send(result);
});

module.exports = app;
