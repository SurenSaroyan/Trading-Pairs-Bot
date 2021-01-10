const { Telegraf } = require('telegraf')
const { extra } = require('../helpers/constants')
const ws = require('./subscription-service');
const spreader = require('./response-handler-service');

module.exports = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.start( async (scx) => {
        try {
            await bot.telegram.sendMessage(scx.chat.id,'Menu', extra);
        } catch (e) {
            console.log('START ->', e);
        }

    });

    bot.on('message',  async (msg) => {
        const chatId = msg.chat.id;
        try {
            if (msg.update.message.text.includes('=')) {
                const [key,value] = msg.update.message.text.split('=');
                if (key === 'API_KEY') {
                    await spreader().getAccountBalance(bot,chatId,value);
                } else {
                    const [price, border] = value.split('/');
                    ws.send(chatId,key.toLowerCase(), price, border.toLowerCase());
                    ws.message(bot);
                    await bot.telegram.sendMessage(chatId,'Choose',{
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Home',
                                        callback_data: 'back'
                                    },
                                    {
                                        text: 'My Subscriptions',
                                        callback_data: 'getMySubscriptions'
                                    }
                                ]
                            ]
                        }
                    })
                }
            } else {
             await bot.telegram.sendMessage(chatId,'Wrong input type',{})
            }
        } catch (e) {
            console.log('MESSAGE ->',e);
            await bot.telegram.sendMessage(chatId,'Wrong input type',{})
        }
    });

    bot.on('callback_query', async (query) => {
        try {
            const { id } = query.chat;
            const { data } = query.update.callback_query;
            const callbackObject = spreader();
            if (callbackObject[data]) {
                await callbackObject[data](bot,id);
            } else {
                await bot.telegram.sendMessage(id,`Alert when ${data} is (type your preferred price), format ${data}=$price(MAX/MIN)\n ex.\n ${data}=10/MAX\n ${data}=20/MIN`);
            }
        } catch (e) {
            console.log('CALLBACK QUERY->', e);
        }
    });

    bot.launch();
};


