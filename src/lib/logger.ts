import { createConsola, LogLevels } from "consola";
import { IS_DEV } from "./const";

const logger = createConsola({
  level: IS_DEV ? LogLevels.debug : LogLevels.info,
  defaults: {
    tag: "apigene-mcp-client",
  },
});

export default logger;
