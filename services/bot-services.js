const axios = require('axios');
const { Telegraf } = require('telegraf');

const crypto = require('crypto');

const generateTime =  () => {
    return 'timestamp=' + Date.now();
}
const apiSecret = 'dVVi5CCK0A45oQFXt5deDSys7vJJQB75wmSTFCY9qzjm6OLd49NNEztsqZrvOr69';

const preparedData = (arr) => {
    const data = arr.reduce((acc,item,index) => {
        if ((index + 1) % 5) {
            acc.current.push({text: item.symbol,callback_data: item.symbol });
        } else {
            acc.sorted.push(acc.current);
            acc.current = [];
        }
        return acc;
    },{
        sorted: [],
        current: []
    });
    return [...data.sorted,[...data.current]]
}

async function generateSignature(query_string) {
    return await crypto
        .createHmac('sha256', apiSecret)
        .update(`recvWindow=60000&${query_string}`)
        .digest('hex');
}

const callbackObject = {
    getAllTradingPairs: async (bot,id) => {
        const data = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
        const symbols = data.data.symbols.slice(0,100);
        const inlineKeyboard = preparedData(symbols);
        bot.telegram.sendMessage(id,'TOP 100 Trading Pairs', {
            reply_markup : {
                inline_keyboard: inlineKeyboard
            }
        });
    },
    getUserBalance: async (bot,id) => {
        bot.telegram.sendMessage(id,'Please type your API KEY in this format API_KEY=$API_KEY');
    },
    getAccountBalance: async (bot,id,APIKEY) => {
        try {
            const str = generateTime();
            const signature = await generateSignature(str);
            const data = await axios.get(`https://api.binance.com/api/v3/account?recvWindow=60000&${str}&signature=${signature}`, {
                headers: {
                    'X-MBX-APIKEY': `${APIKEY}`,
                }
            });
            const {data:{balances}} = data;
            bot.telegram.sendMessage(id,`Your balance is ${balances && balances.length ? balances : 0}`);
        }catch (e) {
            bot.telegram.sendMessage(id,'User not found');
        }
    }
}

module.exports = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.start( (scx) => {
        bot.telegram.sendMessage(scx.chat.id,'Get All trading pairs', {
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
    });

    bot.on('message',  msg => {
        const chatId = msg.chat.id;
        if (msg.update.message.text.includes('API_KEY')) {
            const API_KEY = msg.update.message.text.split('=')[1];
            callbackObject.getAccountBalance(bot,chatId,API_KEY);
            return;
        }
        bot.telegram.sendMessage(chatId,'Get All trading pairs', {
            reply_markup : {
                inline_keyboard: [
                    [
                        {
                            text:'Trading Pairs',
                            callback_data: 'getAllTradingPairs'
                        }
                    ]
                ]
            }
        });
    });

    bot.on('callback_query', async (query) => {
        try {
            const { id } = query.chat;
            const { data } = query.update.callback_query;
            await callbackObject[data](bot,id);
        } catch (e) {
            console.log(e);
        }
    });

    bot.launch();
};


