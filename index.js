const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const {
    joinVoiceChannel
} = require('@discordjs/voice');

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1555260264763490366';
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ==========================================
// NICKS
// ==========================================

const partes1 = [
    'zy', 'xe', 'ky', 'va', 'no',
    'ze', 'lu', 'ry', 'vi', 'ka',
    'xa', 'ny', 'sy', 'vo', 'zi',
    'ke', 'my', 'ay', 're', 'ix',
    'za', 'el', 'ox', 'vy', 'az',
    'en', 'ev', 'ar', 'yn', 'ly'
];

const partes2 = [
    'ven', 'vex', 'zen', 'rix', 'ryn',
    'zor', 'lyn', 'nox', 'vyn', 'xen',
    'zyl', 'ren', 'vox', 'kir', 'yro',
    'xel', 'zan', 'ver', 'nex', 'zyx',
    'lor', 'vyr', 'zeno', 'kyo', 'xyr',
    'rav', 'zel'
];

const nicksUsados = new Set();

function gerarNick() {
    let nick;

    do {
        const parte1 =
            partes1[Math.floor(Math.random() * partes1.length)];

        const parte2 =
            partes2[Math.floor(Math.random() * partes2.length)];

        nick = parte1 + parte2;

    } while (nicksUsados.has(nick));

    nicksUsados.add(nick);

    return nick;
}

function gerarLista() {
    const lista = [];

    while (lista.length < 8) {
        const nick = gerarNick();

        if (!lista.includes(nick)) {
            lista.push(nick);
        }
    }

    return lista;
}

function criarEmbed() {
    const nicks = gerarLista();

    return new EmbedBuilder()
        .setTitle('🔎 Nicks sugeridos')
        .setDescription(
            nicks
                .map((nick, index) => {
                    return `**${index + 1}.** \`${nick}\``;
                })
                .join('\n')
        )
        .setFooter({
            text: 'Clique em 🔄 Gerar novamente para novos nicks'
        });
}

function criarBotaoNicks() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gerar_nicks')
            .setLabel('Gerar novamente')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
    );
}

// ==========================================
// ENTRAR NA CALL
// ==========================================

async function entrarNaCall() {
    try {
        if (!VOICE_CHANNEL_ID) {
            console.log('❌ VOICE_CHANNEL_ID não está configurado.');
            return;
        }

        const canal = await client.channels.fetch(
            VOICE_CHANNEL_ID
        );

        if (!canal) {
            console.log('❌ Canal de voz não encontrado.');
            return;
        }

        joinVoiceChannel({
            channelId: canal.id,
            guildId: canal.guild.id,
            adapterCreator: canal.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log('🎙️ Bot entrou na call!');
    } catch (error) {
        console.error('❌ Erro ao entrar na call:', error);
    }
}

// ==========================================
// BOT ONLINE
// ==========================================

client.once('clientReady', async () => {

    console.log(`🟢 Bot online como ${client.user.tag}`);

    // ======================================
    // COMANDOS
    // ======================================

    const commands = [

        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Responde com Pong!')

            .toJSON(),

        new SlashCommandBuilder()
            .setName('nicks')
            .setDescription('Gera uma lista de nicks aleatórios')

            .toJSON()
    ];

    const rest = new REST({
        version: '10'
    }).setToken(TOKEN);

    try {

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {
                body: commands
            }
        );

        console.log('✅ Comandos /ping e /nicks registrados!');

    } catch (error) {

        console.error(
            '❌ Erro ao registrar comandos:',
            error
        );
    }

    // Entrar na call
    await entrarNaCall();
});

// ==========================================
// INTERAÇÕES
// ==========================================

client.on('interactionCreate', async interaction => {

    // ======================================
    // COMANDOS SLASH
    // ======================================

    if (interaction.isChatInputCommand()) {

        // /ping
        if (interaction.commandName === 'ping') {

            await interaction.reply('Pong! 🏓');

            return;
        }

        // /nicks
        if (interaction.commandName === 'nicks') {

            await interaction.reply({
                embeds: [
                    criarEmbed()
                ],
                components: [
                    criarBotaoNicks()
                ]
            });

            return;
        }
    }

    // ======================================
    // BOTÃO GERAR NOVAMENTE
    // ======================================

    if (interaction.isButton()) {

        if (interaction.customId === 'gerar_nicks') {

            await interaction.update({
                embeds: [
                    criarEmbed()
                ],
                components: [
                    criarBotaoNicks()
                ]
            });

            return;
        }
    }
});

// ==========================================
// SE O BOT FOR REMOVIDO DA CALL,
// TENTA ENTRAR NOVAMENTE
// ==========================================

client.on('voiceStateUpdate', async (oldState, newState) => {

    if (oldState.member?.id !== client.user?.id) {
        return;
    }

    if (
        oldState.channelId &&
        !newState.channelId
    ) {
        console.log('⚠️ Bot saiu da call. Tentando entrar novamente...');

        setTimeout(() => {
            entrarNaCall();
        }, 3000);
    }
});

// ==========================================
// LOGIN
// ==========================================

client.login(TOKEN);