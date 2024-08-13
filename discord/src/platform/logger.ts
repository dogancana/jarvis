import { createLogger, format, transports } from "winston";
import { omit } from "lodash";

const myFormat = format.printf(({ level, message, ...metadata }) => {
  let msg = `[${level}] : ${message} `;
  try {
    if (metadata) {
      const omitted = omit(metadata, ["level", "message", "timestamp"]);
      const extra = `\n${JSON.stringify(
        omitted,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        2
      )}`;
      if (extra.replaceAll(" ", "") === "\n{}") return msg;
      return msg + extra;
    }
  } catch (e) {
    console.error(e);
  }
  return msg;
});

const defaultFormat = format.combine(
  format.splat(),
  myFormat,
  format.colorize()
);

export const logger = createLogger({
  level: "info",
  format: defaultFormat,
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ format: defaultFormat }));
}
