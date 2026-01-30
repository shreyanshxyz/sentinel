import app from "./app.js";
import { appConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";

const PORT = appConfig.server.port;
const HOST = appConfig.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${appConfig.server.env}`);
});
