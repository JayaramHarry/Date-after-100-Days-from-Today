const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const dbObjectToObjectResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getDetailsQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getDetailsQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "HARRY");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 2
app.get("/states/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getStateQuery = `
                    SELECT state_id,
                            state_name,
                            population
                    FROM state;`;
        const result = await db.all(getStateQuery);
        response.send(result.map((each) => dbObjectToObjectResponse(each)));
      }
    });
  }
});

//API 3

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getStateQuery = `
                        SELECT state_id,
                                state_name,
                                population
                        FROM state
                        WHERE state_id = '${stateId}';`;
        const result = await db.get(getStateQuery);
        response.send(dbObjectToObjectResponse(result));
      }
    });
  }
});

//API 4
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const postDistrictQuery = `
            INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
            VALUES (
                '${districtName}',
                '${stateId}',
                '${cases}',
                '${cured}',
                '${active}',
                '${deaths}'
                    );`;
        await db.run(postDistrictQuery);
        response.send("District Successfully Added");
      }
    });
  }
});

//API 5
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getDistrictIdQuery = `
            SELECT * FROM district
            WHERE district_id = '${districtId}'`;
        const results = await db.get(getDistrictIdQuery);
        response.send(dbObjectToObjectResponse(results));
      }
    });
  }
});

//API 6
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const deleteQuery = `
                DELETE FROM district
                WHERE district_id = '${districtId}';`;
        await db.run(deleteQuery);
        response.send("District Removed");
      }
    });
  }
});

//API 7
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const updateQuery = `
        UPDATE district
        SET district_name = '${districtName}',
            state_id = '${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = '${deaths}'
        WHERE district_id = '${districtId}';`;
        await db.run(updateQuery);
        response.send("District Details Updated");
      }
    });
  }
});

//API 8
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "HARRY", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getStatsQuery = `
            SELECT 
                SUM(cases),
                SUM(cured),
                SUM(active),
                SUM(deaths)
            FROM 
                district
            WHERE 
                state_id = ${stateId};`;
        const dist = await db.get(getStatsQuery);
        console.log(dist);
        response.send({
          totalCases: dist["SUM(cases)"],
          totalCured: dist["SUM(cured)"],
          totalActive: dist["SUM(active)"],
          totalDeaths: dist["SUM(deaths)"],
        });
      }
    });
  }
});

module.exports = app;
