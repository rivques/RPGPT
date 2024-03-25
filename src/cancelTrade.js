const { App } = require('@hackclub/bag')
require('dotenv').config()

async function main() {
  const bag = await App.connect({
    appId: Number(process.env.BAG_APP_ID),
    key: process.env.BAG_APP_KEY
  })

  console.log(bag)
  const tradeToCancel = 234;

  bag.closeTrade({id: tradeToCancel, cancel: true}).then((response) => {
      console.log(response);
  })
}

main()