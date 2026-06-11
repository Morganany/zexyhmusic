const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// INISIALISASI DISTUBE
const distube = new DisTube(client, {
    plugins: [
        new YtDlpPlugin({ update: false })
    ]
});

const PREFIX = process.env.PREFIX || '!';

// ====== LOAD COMMANDS DENGAN SAFEGUARD ======
const commandsPath = './commands';
if (!fs.existsSync(commandsPath)) {
    console.warn(`⚠️ Folder '${commandsPath}' tidak ditemukan! Buat folder ini dan masukkan file command seperti 'zexplay.js' ke dalamnya.`);
} else {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`📂 Menemukan ${commandFiles.length} file command.`);
    
    for (const file of commandFiles) {
        try {
            const command = require(`${commandsPath}/${file}`);
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`✅ Command dimuat: ${command.name}`);
            } else {
                console.warn(`⚠️ File ${file} tidak memiliki 'name' yang valid.`);
            }
        } catch (error) {
            console.error(`❌ Gagal memuat command ${file}:`, error);
        }
    }
}

// ====== LOAD DISTUBE EVENTS ======
try {
    require('./events/distubeEvents')(distube);
    console.log('✅ Distube events dimuat.');
} catch (error) {
    console.warn('⚠️ Gagal memuat distubeEvents. Pastikan file events/distubeEvents.js ada.');
}

// ============================================================
// ⚠️ TAMBAHAN BARU: MEMBUKA BISU BOT SAAT LAGU DIPUTAR ⚠️
// ============================================================
distube.on('playSong', (queue, song) => {
    // Saat lagu mulai diputar, perintahkan bot untuk membuka bisu (undeafen)
    if (queue.voice.connection) {
        queue.voice.connection.setDeaf(false);
        console.log("🔊 Bot membuka bisu (undeafen) agar suara lagu terdengar.");
    }
});
// ============================================================

// ====== READY EVENT ======
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} online!`);
    client.user.setPresence({
        activities: [{ name: `${PREFIX}play | YouTube Music`, type: ActivityType.Listening }],
        status: 'online'
    });
});

// ====== MESSAGE CREATE EVENT (DEBUGGING MODE) ======
client.on('messageCreate', async (message) => {
    // 1. Abaikan bot dan DM
    if (message.author.bot || !message.guild) return;

    // 2. Cek prefix
    if (!message.content.startsWith(PREFIX)) return;

    // 3. Parsing command
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`🔍 Command diterima: "${commandName}" dengan args:`, args); // LOG PENTING

    // 4. Cek apakah command ada di collection
    const command = client.commands.get(commandName);
    if (!command) {
        console.log(`⚠️ Command "${commandName}" tidak ditemukan di client.commands.`);
        // Beri tahu user jika command tidak ada (opsional, untuk debugging)
        return message.reply(`❌ Command \`${commandName}\` tidak dikenal. Cek apakah file command sudah benar namanya.`);
    }

    // 5. Eksekusi command
    console.log(`▶️ Menjalankan command: ${command.name}`);
    try {
        // Kirim feedback bahwa command diterima (agar user tahu bot merespon)
        const feedbackMsg = await message.reply(`⏳ Memproses perintah **${command.name}**...`);
        
        await command.execute(message, args, client, distube);
        
        // Jika command berhasil, hapus/update feedback (tapi jangan sampai error)
        // feedbackMsg.delete().catch(() => {});
    } catch (error) {
        console.error('❌ Error saat menjalankan command:', error);
        message.reply(`❌ Error: \`\`\`${error.message}\`\`\``);
    }
});

// ============================================================
// ⚠️ TAMBAHAN BARU: MENCEGAH BOT DEAFEN SAAT JOIN VC ⚠️
// ============================================================
client.on('voiceStateUpdate', (oldState, newState) => {
    // Cek apakah bot sendiri yang bergabung ke voice channel
    if (newState.member.user.id === client.user.id) {
        // Jika bot masuk ke channel (newState.channel ada)
        if (newState.channel) {
            // Set Deaf menjadi FALSE (membuka bisu)
            console.log("🔊 Bot membuka bisu (undeafen) setelah join VC.");
        }
    }
});
// ============================================================
client.login(process.env.DISCORD_TOKEN);