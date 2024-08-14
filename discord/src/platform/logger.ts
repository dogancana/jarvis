import { createLogger, format, transports } from "winston";
import { omit } from "lodash";

const defaultFormat = format.combine(format.colorize());

export const logger = createLogger({
  level: "info",
  format: format.combine(formatFactory(), defaultFormat),
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(formatFactory({ space: 2 }), defaultFormat),
    })
  );
}

function formatFactory(config?: { space?: number }) {
  const { space } = config ?? {};

  return format.printf(({ level, message, ...metadata }) => {
    let msg = `[${level}] : ${message} `;
    try {
      if (metadata) {
        const omitted = omit(metadata, ["level", "message", "timestamp"]);
        const extra = `\n${JSON.stringify(
          omitted,
          (_, value) => (typeof value === "bigint" ? value.toString() : value),
          space
        )}`;
        if (extra.replaceAll(" ", "") === "\n{}") return msg;
        return msg + extra;
      }
    } catch (e) {
      console.error(e);
    }
    return msg;
  });
}
