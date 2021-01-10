module.exports = {
    extra : {
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
                    },
                    {
                        text:'My Subscriptions',
                        callback_data: 'getMySubscriptions'
                    }
                ]
            ]
        }
    },
    MAX:'max',
    MIN:'min'
}
