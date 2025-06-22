const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const keepAlive = require('./server');
const fs = require('fs');
const colors = require('colors');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = "!!";

if (config.slash) {
  const commands = [
    {
      name: 'dm',
      description: 'Send a DM to all members',
      options: [
        {
          type: 3,
          name: 'message',
          description: 'The message to send',
          required: true,
        },
      ],
    },
  ];

  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

  (async () => {
    try {
      console.log('Started refreshing application (/) commands.'.yellow);

      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });

      console.log('Successfully reloaded application (/) commands.'.green);
    } catch (error) {
      console.error(error.message.red);
    }
  })();
}

client.on("ready", () => {
  console.log(`Prefix: ${prefix} | Mass DM Command: ${prefix}dm`.cyan);
  client.user.setActivity({ type: "WATCHING", name: `https://dsc.gg/logistack/` });
});

function getName(user) {
  return user.discriminator === '0' ? `@${user.username}` : `${user.username}#${user.discriminator}`;
}

client.on(Events.MessageCreate, message => {
  if (config.prefix && message.content.startsWith(prefix + 'dm')) {
    message.delete();
    const args = message.content.split(" ").slice(1);
    const argresult = args.join(' ');

    message.guild.members.fetch().then(members => {
      members.forEach(member => {
        if (!member.user.bot) {
          const name = getName(member.user);
          member.send(argresult)
            .then(() => {
              console.log(`[+] Message sent to ${name}`.green);
            })
            .catch(e => {
              console.error(`[-] Failed to send to ${name}`.red);
            });
        }
      });
      console.log(`[/] All messages processed`.blue);
      message.channel.send(`:white_check_mark: | **All messages sent successfully.**`).then(msg => {
        setTimeout(() => msg.delete(), 15000);
      });
    });
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isCommand()) {
    const { commandName, options } = interaction;

    if (commandName === 'dm') {
      const allowedUser = process.env.ALLOWED_USER; // User ID

      if (interaction.user.id !== allowedUser) {
        return interaction.reply('You do not have permission to use this command.'.red);
      }

      const messageToSend = options.getString('message');

      await interaction.deferReply();

      const members = await interaction.guild.members.fetch();
      members.forEach(member => {
        if (!member.user.bot) {
          const name = getName(member.user);
          member.send(messageToSend)
            .then(() => {
              console.log(`[+] Message sent to ${name}`.green);
            })
            .catch(e => {
              console.error(`[-] Failed to send to ${name}`.red);
            });
        }
      });

      console.log(`[/] All messages processed`.blue);
      await interaction.editReply(`:white_check_mark: | **All messages sent successfully.**`);
    }
  }
});

keepAlive();
client.login(process.env.TOKEN);