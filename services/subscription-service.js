const WebSocket = require('ws');
const ws = new WebSocket(`${process.env.SOCKET_URL}/stream?streams=miniTicker`);
const subscriptions = {};

module.exports = {
    send: (chatId, key, value) => {
        try {
            ws.send(JSON.stringify({
                method: 'SUBSCRIBE',
                params: [
                    `${key}@miniTicker`
                ],
                id: chatId
            }));

            if ((typeof subscriptions[key]) === 'object') {
                subscriptions[key].push({id:chatId,price:value});
            } else {
                subscriptions[key] = [{id:chatId,price:value}];
            }

        } catch (e) {
            console.log('SEND ->', e);
        }
    },
    message: (bot) => {
        ws.on('message', (response) => {
            try {
                const { stream, data } = JSON.parse(response);
                if (stream && data) {
                    const key = stream.split('@')[0];
                    if (subscriptions[key]) {
                        const chatIds = subscriptions[key].filter(i => data.c >= i.price)
                        if (chatIds && chatIds.length) {
                            chatIds.forEach((e) => {
                                bot.telegram.sendMessage(e.id,`${key.toUpperCase()} price is ${data.c}`)
                                ws.send(JSON.stringify({
                                    method: 'UNSUBSCRIBE',
                                    params: [
                                        `${key}@miniTicker`
                                    ],
                                    id: e.id
                                }));
                            });
                            subscriptions[key] = subscriptions[key].filter(i => data.c < i.price);
                        }
                    }
                }
            } catch (e) {
                console.log('MESSAGE ->', e);
                return { stream: null, data: null}
            }
        })
    }
}

