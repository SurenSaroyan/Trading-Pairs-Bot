const crypto = require('crypto');

module.exports = {
    generateSignature: (query_string) => {
        return crypto
            .createHmac('sha256', process.env.API_SECRET)
            .update(`recvWindow=60000&${query_string}`)
            .digest('hex');
    },
    preparedData: (bot,arr) => {
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
    },
}
