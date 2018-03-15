import * as express from 'express';
import * as bodyParser from 'body-parser';
import chalk from 'chalk';
import { Application } from 'express';

import RootRouter from './routes';

const DEV_PORT = 3000;
const PORT = process.env.PORT || DEV_PORT;
const app: Application = express();

// Load body parser to handle POST requests
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use('/api/v1/', RootRouter);

/* eslint-disable no-console */
app.listen(PORT, err => {
  if (err) {
    console.log(chalk.red(`Error ${err}`));
    return;
  }

  console.log(chalk.green(`Express server running on port:  ${PORT}`));
});
/* eslint-enable no-console */
