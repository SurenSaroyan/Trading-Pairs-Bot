const axios = require('axios');
const baseURL = process.env.BINANCE_URL;
const { extra } = require('../helpers/constants');

const { generateSignature, preparedButtons, preparedSubscriptions } = require("../helpers/common-helper");
const { getSubscription } = require('../services/subscription-service');

module.exports = () => {
    return{
            getAllTradingPairs: async (bot,id) => {
                try {
                    const data = await axios.get(`${baseURL}/exchangeInfo`);
                    const symbols = data.data.symbols.slice(0,100);
                    const inlineKeyboard = preparedButtons(symbols);
                    await bot.telegram.sendMessage(id,'TOP 100 Trading Pairs', {
                        reply_markup : {
                            inline_keyboard: [...inlineKeyboard, [{text:'Back', callback_data: 'back'}]]
                        }
                    });
                } catch (e) {
                    throw `getAllTradingPairs -> ${e}`;
                }
            },
            getUserBalance: async (bot,id) => {
                try {
                    await bot.telegram.sendMessage(id,'Please type your API KEY in this format API_KEY=$API_KEY',{});
                } catch (e) {
                    throw `getUserBalance -> ${e}`;
                }
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
            },
            getMySubscriptions: async (bot,id) => {
                try {
                    const mySubscriptions = getSubscription(id);
                    if (mySubscriptions && mySubscriptions.length) {
                        await bot.telegram.sendMessage(id,preparedSubscriptions(mySubscriptions))
                    } else  {
                        await bot.telegram.sendMessage(id,'You dont have any subscription', {
                            reply_markup : {
                                inline_keyboard: [[{text:'Home', callback_data: 'back'}]]
                            }
                        });
                    }
                } catch (e) {
                    throw `getMySubscriptions -> ${e}`;
                }
            },
            back: async (bot,id) => {
                try {
                    await bot.telegram.sendMessage(id,'Menu', extra);
                } catch (e) {
                    throw `Back -> ${e}`;
                }
            }
        }
}
