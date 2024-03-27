// this is a utility script that cancels a trade that was started
// it's useful for if an error is thrown after a trade is started
// but before the trade is completed
const { App } = require('@hackclub/bag')
require('dotenv').config()

async function main() {
  const bag = await App.connect({
    appId: Number(process.env.BAG_APP_ID),
    key: process.env.BAG_APP_KEY
  })

  console.log(bag)

  const tradeToCancel = 552;

  trade = await bag.getTrade({tradeId: tradeToCancel})
  console.log(trade);

  response = await bag.closeTrade({tradeId: tradeToCancel, cancel: true})
  console.log(response);
}

main()