const axios = require('axios');
const { Telegraf } = require('telegraf');

const crypto = require('crypto');

const getServerTime = async () => {
    // const { data : { serverTime }} = await axios.get('https://api.binance.com/api/v3/time');
    // console.log(serverTime, '------', Date.now());
    // console.log(serverTime - Date.now());
    return 'timestamp=' + Date.now();
}
const apiSecret = 'NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j';

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
        .update(`recvWindow=60000&$timestamp=`)
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
        const str = await getServerTime();
        const signature = await generateSignature(str);
        const data = await axios.get(`https://api.binance.com/api/v3/account?timestamp=1609770871957&signature=8ca28bcc30105cba76ea7dcc4699cca878688b41c602b4ffe60acfac4d1cdb18`, {
            headers: {
                'X-MBX-APIKEY': 'LtyDiyRrkEF9hsKCI2UbtjJXJPFA0S9wPkD5m1XukCOxpDCCnRXmFMSOlpqXPfXz',
            }
        });
        bot.telegram.sendMessage(id,'User balance', {
            reply_markup : {
                inline_keyboard: [{text: 'aaa',callback_data: 'item.symbol' }]
            }
        });
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


