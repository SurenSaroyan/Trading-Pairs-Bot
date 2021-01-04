const axios = require('axios');
const { Telegraf } = require('telegraf')
const { generateSignature, preparedData } = require("../helpers/common-helper");
const baseURL = process.env.BINANCE_URL;
const ws = require('./subscription-service');

const callbackObject = {
    getAllTradingPairs: async (bot,id) => {
        const data = await axios.get(`${baseURL}/exchangeInfo`);
        const symbols = data.data.symbols.slice(0,100);
        const inlineKeyboard = preparedData(bot, symbols);
        await bot.telegram.sendMessage(id,'TOP 100 Trading Pairs', {
            reply_markup : {
                inline_keyboard: inlineKeyboard
            }
        });
    },
    getUserBalance: async (bot,id) => {
        await bot.telegram.sendMessage(id,'Please type your API KEY in this format API_KEY=$API_KEY',{});
    },
    getAccountBalance: async (bot,id,APIKEY) => {
        try {
            const timestamp = `timestamp=${Date.now()}`;
            const signature = generateSignature(timestamp);
            const data = await axios.get(`${baseURL}/account?recvWindow=60000&${timestamp}&signature=${signature}`, {
                headers: {
                    'X-MBX-APIKEY': `${APIKEY}`,
                }
            });
            const {data:{balances}} = data;
            let text = ''
            if (balances && balances.length) {
                text = balances.reduce((acc,item)=>{
                    acc += `${item.asset} -> ${item.free} (${(+item.locked) ? 'locked' : 'unlocked'})\n`
                    return acc;
                },'')
            }
            await bot.telegram.sendMessage(id,`Your balance is ${text ? '\n' + text : 0}`);
        } catch (e) {
            await bot.telegram.sendMessage(id,'User not found');
        }
    }
}

module.exports = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.start( async (scx) => {
        try {
            await bot.telegram.sendMessage(scx.chat.id,'Get All trading pairs', {
                reply_markup : {
                    inline_keyboard: [
                        [
                            {
                                text:'Trading Pairs',
                                callback_data: 'getAllTradingPairs'
                            }
                        ],
                        [
                            {
                                text:'Check Balance',
                                callback_data: 'getUserBalance'
                            }
                        ]
                    ]
                }
            });
        } catch (e) {
            console.log('START ->', e);
        }

    });

    bot.on('message',  async (msg) => {
        try {
            const chatId = msg.chat.id;
            if (msg.update.message.text.includes('=')) {
                const [key,value] = msg.update.message.text.split('=');
                if (key === 'API_KEY') {
                    await callbackObject.getAccountBalance(bot,chatId,value);
                } else {
                    ws.send(chatId,key.toLowerCase(), value);
                    ws.message(bot);
                }
            } else {
             bot.telegram.sendMessage(chatId,'Wrong input type',{})
            }
        } catch (e) {
            console.log('MESSAGE ->',e);
        }
    });

    bot.on('callback_query', async (query) => {
        try {
            const { id } = query.chat;
            const { data } = query.update.callback_query;
            if (callbackObject[data]) {
                await callbackObject[data](bot,id);
            } else {
                await bot.telegram.sendMessage(id,`Alert when ${data} is (type your preferred price), format ${data}=$price`);
            }
        } catch (e) {
            console.log('CALLBACK QUERY->', e);
        }
    });

    bot.launch();
};


