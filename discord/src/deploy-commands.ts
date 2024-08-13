import { REST, Routes } from "discord.js";
import { config, logger } from "./platform";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands(props: DeployCommandsProps) {
  try {
    const { guildId } = props;
    logger.info(`Deploying commands to guild`, { props });

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      { body: commandsData }
    );

    logger.info("Successfully reloaded application (/) commands.");
  } catch (error) {
    logger.error(error);
  }
}
