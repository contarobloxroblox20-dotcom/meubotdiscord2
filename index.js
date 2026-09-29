const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ActivityType
} = require('discord.js');

const {
    joinVoiceChannel,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

async function entrarNaCall() {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);

    if (!channel) {
        console.log('❌ Canal de voz não encontrado.');
        return;
    }

    if (!channel.isVoiceBased()) {
        console.log('❌ Esse ID não é de uma call.');
        return;
    }

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    console.log('🔊 Entrei na call!');

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('⚠️ Bot foi desconectado. Tentando voltar...');

        setTimeout(() => {
            entrarNaCall();
        }, 5000);
    });
}

client.once('clientReady', async () => {
    console.log(`🟢 Bot online como ${client.user.tag}!`);

    // 🎮 ATIVIDADE DO RISE PRESENCE
    client.user.setActivity('Rise Presence', {
        type: ActivityType.Playing
    });

    console.log('🎮 Rise Presence ativado!');

    const commands = [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Responde com Pong!')
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Comando /ping registrado!');
    } catch (error) {
        console.error(error);
    }

    entrarNaCall();
});

client.on('error', console.error);

client.login(TOKEN);