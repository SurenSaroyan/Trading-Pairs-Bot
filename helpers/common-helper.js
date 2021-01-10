const crypto = require('crypto');
const { MAX } = require('./constants');

module.exports = {
    generateSignature: (query_string) => {
        return crypto
            .createHmac('sha256', process.env.API_SECRET)
            .update(`recvWindow=60000&${query_string}`)
            .digest('hex');
    },
    preparedButtons: (arr) => {
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

    preparedSubscriptions: (arr) => {
        let max = `MAX Borders is:\n`;
        let min = `MIN Borders is:\n`;
        arr.sort((a,b) => a.key - b.key).map(item => {
            if (item.border === MAX) {
                max += `${item.key.toUpperCase()} -> ${item.value}\n`;
                return;
            }
            min += `${item.key.toUpperCase()} -> ${item.value}\n`
        });
        return `${max}\n${min}`
    }
}
