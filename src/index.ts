import { Application } from "express";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import chalk from "chalk";

import RootRouter from "./routes";

const DEV_PORT = 9999;
const PORT = process.env.PORT || DEV_PORT;
const app: Application = express();

// Load body parser to handle POST requests
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//initialize a simple http server
const server = http.createServer(app);
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

RootRouter(wss);

// app.use("/api/v1/", RootRouter);

server.listen(PORT, err => {
  if (err) {
    console.log(chalk.red(`Error from Main Handler ${err}`));
    return;
  }

  console.log(chalk.green(`Express server running on port:  ${PORT}`));
});
