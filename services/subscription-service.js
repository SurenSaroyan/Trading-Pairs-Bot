const WebSocket = require('ws');
const ws = new WebSocket(`${process.env.SOCKET_URL}/stream?streams=miniTicker`);
const { MAX, MIN } = require('../helpers/constants')
const subscriptions = {
    min:{},
    max:{}
};
const userSubscriptions = {};

module.exports = {
    send: (chatId, key, value, border) => {
        try {
            ws.send(JSON.stringify({
                method: 'SUBSCRIBE',
                params: [
                    `${key}@miniTicker`
                ],
                id: chatId
            }));

            if ((typeof subscriptions[border][key]) === 'object') {
                subscriptions[border][key].push({id:chatId,price:value});
            } else {
                subscriptions[border][key] = [{id:chatId,price:value}];
            }

            if ((typeof userSubscriptions[chatId]) === 'object') {
                userSubscriptions[chatId].push({key, value, border});
            } else {
                userSubscriptions[chatId] = [{key, value, border}];
            }

        } catch (e) {
            console.log('SEND ->', e);
           throw e;
        }
    },
    message: (bot) => {
        ws.on('message', async (response) => {
            try {
                const { stream, data } = JSON.parse(response);
                if (stream && data) {
                    const key = stream.split('@')[0];
                    Object.keys(subscriptions).map(border => {
                        if (subscriptions[border][key]) {
                            const chatIds = subscriptions[border][key].filter(i => border === MAX ? +data.c >= +i.price : +data.c <= +i.price);
                            if (chatIds && chatIds.length) {
                                chatIds.forEach((e) => {
                                    bot.telegram.sendMessage(e.id,`${border.toUpperCase()} ${key.toUpperCase()} price is ${data.c}`).then(() => {
                                        ws.send(JSON.stringify({
                                            method: 'UNSUBSCRIBE',
                                            params: [
                                                `${key}@miniTicker`
                                            ],
                                            id: e.id
                                        }));
                                    })
                                    userSubscriptions[e.id] = userSubscriptions[e.id].filter(i =>
                                        i.border !== border || (i.border === border && (border === MAX ? +i.value >= +data.c : +i.value <= +data.c)))
                                });
                                subscriptions[border][key] = subscriptions[border][key].filter(i => border === MAX ? +i.price >= +data.c : +i.price <= +data.c);
                            }
                        }
                    })
                }
            } catch (e) {
                console.log('MESSAGE ->', e);
                return { stream: null, data: null}
            }
        })
    },
    getSubscription: (id) => userSubscriptions[id]
}

