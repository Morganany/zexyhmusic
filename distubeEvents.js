const { EmbedBuilder } = require('discord.js');

module.exports = (distube) => {
    distube.on('playSong', (queue, song) => {
        queue.textChannel.send({
            embeds: [new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle('🎵 Sekarang Main')
                .setDescription(`[${song.name}](${song.url})`)
                .addFields(
                    { name: '⏱️ Durasi', value: song.formattedDuration, inline: true },
                    { name: '👤 Request', value: `${song.user}`, inline: true }
                )
                .setThumbnail(song.thumbnail)]
        });
    });

    distube.on('addSong', (queue, song) => {
        queue.textChannel.send({
            embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setDescription(`📋 Ditambahkan: [${song.name}](${song.url}) \`[${song.formattedDuration}]\``)]
        });
    });

    distube.on('addList', (queue, playlist) => {
        queue.textChannel.send({
            embeds: [new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('📑 Playlist Ditambahkan')
                .setDescription(`[${playlist.name}](${playlist.url})`)
                .addFields(
                    { name: '📊 Total Lagu', value: `${playlist.songs.length}`, inline: true },
                    { name: '⏱️ Durasi', value: playlist.formattedDuration, inline: true }
                )]
        });
    });

    distube.on('finish', (queue) => {
        queue.textChannel.send('✅ Semua lagu di queue selesai!');
    });

    distube.on('empty', (queue) => {
        queue.textChannel.send('👋 Channel sepi, bot disconnect.');
    });

    distube.on('error', (channel, error) => {
        console.error('DisTube Error:', error);
        if (channel) channel.send(`❌ Error: ${error.message?.substring(0, 200)}`);
    });
};