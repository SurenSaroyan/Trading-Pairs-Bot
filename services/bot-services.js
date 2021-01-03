const axios = require('axios');
const { Telegraf } = require('telegraf');

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
        const chatId = query.chat.id;
        const data = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
        const symbols = data.data.symbols.slice(0,100);
        const inlineKeyboard = preparedData(symbols);
        bot.telegram.sendMessage(chatId,'TOP 100 Trading Pairs', {
            reply_markup : {
                inline_keyboard: inlineKeyboard
            }
        });
    });
    bot.launch();
};


