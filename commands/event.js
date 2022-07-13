const i18n = require("../util/i18n");
const { MessageEmbed } = require("discord.js");
const axios = require('axios').default;

module.exports = {
    name: "event",
    description: `Nhận code sự kiện`,
    async execute(message) {
        if(828480698808795171 !=message.channel.id && ( message.guild.id != 937637786054459403 || message.channel.id != 984040073752354826 )) return message.reply(
            `Server hoặc kênh không được phép gọi lệnh này, lệnh này chỉ được phép gọi tại kênh <#984040073752354826>`
        );
        try {
            const listReacts = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const serverListResponse = await axios.get('http://newgun.net:3005/api/server/list');
            const serverList = serverListResponse.data;

            let serverListEmbed = new MessageEmbed()
            .setTitle(`Chọn máy chủ muốn nhận code`)
            .setDescription(`Bạn cần react 1 trong các số dưới đây để chọn máy chủ`)
            .setColor("#F8AA2A");

            try {
                for(var i = 1; i<= serverList.length; i++) {
                    serverListEmbed.addField(listReacts[i-1], `${i}. ${serverList[i-1].Name}`)
                }
            }catch (error) {
                console.log(error)
            }

            var serverListMessage = await message.channel.send(serverListEmbed);

            for(var i = 1; i<= serverList.length; i++) {
                await serverListMessage.react(listReacts[i-1]);
            }

            const filterSvList = (reaction, user) => user.id !== message.client.user.id;
            var collectorSvList = serverListMessage.createReactionCollector(filterSvList, {
                time: 600000
            });
            
            collectorSvList.on("collect", async (reaction, user) => {
                const member = message.guild.member(user);
                var stoppedSv = false;
                var selectedServer = -1;
                for(var i = 1; i<= serverList.length; i++) {
                    if(listReacts[i-1] == reaction.emoji.name){
                        selectedServer = i - 1;
                        break;
                    }
                }

                if(selectedServer != -1) {
                    stoppedSv = true;
                    const responseActives = await axios.get(`http://newgun.net:3005/api/getActives/${serverList[selectedServer].ID}`);
                    const actives = responseActives.data;
                    var countEvent = actives.length > 10 ? 10 : actives.length;
            
                    let resultsEmbed = new MessageEmbed()
                    .setTitle(`Chọn sự kiện muốn nhận code`)
                    .setDescription(`Bạn cần react 1 trong các số dưới đây để nhận code`)
                    .setColor("#F8AA2A");

                    try {
                        for(var i = 1; i<= countEvent; i++) {
                            resultsEmbed.addField(listReacts[i-1], `${i}. ${actives[i-1].Title}`)
                        }
                    }catch (error) {
                        console.log(error)
                    }
                    var playingMessage = await message.channel.send(resultsEmbed);
                    //1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟
                    
                    for(var i = 1; i<= countEvent; i++) {
                        await playingMessage.react(listReacts[i-1]);
                    }

                    const filter = (reaction, user) => user.id !== message.client.user.id;
                    var collector = playingMessage.createReactionCollector(filter, {
                        time: 600000
                    });
                    
                    collector.on("collect", async (reaction, user) => {
                        const member = message.guild.member(user);
                        var stopped = false;
                        for(var i = 1; i<= countEvent; i++) {
                            if(listReacts[i-1] == reaction.emoji.name){
                                try {
                                    const code = await axios.get(`http://newgun.net:3005/api/getCodeActive/${serverList[selectedServer].ID}/${actives[i-1].ActiveID}`);
                                    if(code.data && code.data.status && code.data.status == 'success') {
                                        member.send(
                                            `Code sự kiện ${actives[i-1].Title} tại máy chủ ${serverList[selectedServer].Name} của bạn là : ${code.data.code.AwardID}`
                                        ).catch(console.error);
                                    } else {
                                        console.log(code)
                                        throw new Error('Không có code');
                                    }
                                    
                                } catch (error) {
                                    console.log(error)
                                    member
                                    .send(
                                        `KHÔNG THỂ LẤY CODE SỰ KIỆN NÀY!`
                                    ).catch(console.error);
                                }
                                    
                                
                                
                                collector.stop();
                                collectorSvList.stop();
                                stopped = true;
                                break;
                            }
                        }
                        
                        if(!stopped) {
                            member.send(`Event này không khả dụng, vui lòng liên hệ admin`).catch(console.error);
                            collector.stop();
                            collectorSvList.stop();
                        }
                    });

                    collector.on("end", () => {
                        playingMessage.reactions.removeAll().catch(console.error);
                        if (playingMessage && !playingMessage.deleted) {
                            playingMessage.delete({ timeout: 1000 }).catch(console.error);
                            // message.delete();
                        }
                    });
                }
                
                if(!stoppedSv) {
                    member.send(`Server này không khả dụng, vui lòng liên hệ admin`).catch(console.error);
                    collectorSvList.stop();
                }
            });

            collectorSvList.on("end", () => {
                serverListMessage.reactions.removeAll().catch(console.error);
                if (serverListMessage && !serverListMessage.deleted) {
                    serverListMessage.delete({ timeout: 1000 }).catch(console.error);
                    // message.delete();
                }
            });
        } catch (error) {
            console.error(error);
            return message.channel.send(error.message).catch(console.error);
        }
    }
};
