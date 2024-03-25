import { Item, PlayerID, ItemStack } from "./BagTypes";
import { App } from "@hackclub/bag";

export class BagContext { // Information about the current interaction, used in bot actions
    private bagApp: App
    interactingPlayerID: PlayerID;
    ownerID: PlayerID;
    constructor(app: App, interactingPlayerID: PlayerID, ownerID: PlayerID) {
        this.bagApp = app
        this.interactingPlayerID = interactingPlayerID;
        this.ownerID = ownerID;
    }
    giveItem(item: string) {
        // TODO
        console.log(`Giving item ${item}`);
    }
    async getInventory(player: PlayerID | undefined, itemFilter: Item[]): Promise<ItemStack[]> {
        const inventory = await this.bagApp.getInventory({
            identityId: player ?? this.ownerID,
            available: true
        })
        console.log("inventory:")
        console.log(inventory)
        let result: ItemStack[] = [] // convert from bag's Instance[] to ItemStack[]
        inventory.inventory.forEach((item) => {
            result.push({
                item: item.itemId ?? "unknown",
                quantity: item.quantity ?? 0
            })
        })
        result = result.filter((item) => itemFilter.includes(item.item))
        console.log(result)
        return result;
    }
    async proposeTrade(receiver: PlayerID, itemsToGive: ItemStack[], itemsToReceive: ItemStack[]) {
        const ourInventory = await this.bagApp.getInventory({
            identityId: this.ownerID,
            available: true
        })
        const theirInventory = await this.bagApp.getInventory({
            identityId: receiver,
            available: true
        })
        
        const trade = await this.bagApp.createTrade({
            initiator: this.ownerID,
            receiver: receiver,
        })
        console.log("trade: ")
        console.log(trade)
        let convertedItemsToGive =[]
        for (let item of itemsToGive) {
            const itemFull = ourInventory.inventory.find((instance) => instance.itemId === item.item)
            convertedItemsToGive.push({
                id: itemFull?.id,
                quantity: item.quantity
            })
        }
        console.log("converted items to give: ")
        console.log(convertedItemsToGive)
        await this.bagApp.updateTrade({ // convert from our itemstack into the bag app's item representation
            tradeId: trade.trade?.id,
            identityId: this.ownerID,
            add: convertedItemsToGive
        })
        let convertedItemsToReceive = [];
        for (let item of itemsToReceive) {
            console.log(`finding item ${item.item} among ${theirInventory}`)
            const itemFull = theirInventory.inventory.find((instance) => instance.itemId === item.item)
            convertedItemsToReceive.push({
                id: itemFull?.id,
                quantity: item.quantity
            })
        }
        console.log("converted items to receive: ")
        console.log(convertedItemsToReceive)
        await this.bagApp.updateTrade({
            tradeId: trade.trade?.id,
            identityId: receiver,
            add: convertedItemsToReceive
        })
        console.log("updated trade")
        await this.bagApp.closeTrade({
            tradeId: trade.trade?.id
        })
        console.log("closed trade")
    }
    craftItemFromTarget(target: Item) {
        // TODO
        console.log(`Crafting item ${target}`);
    }
    craftItemFromRecipe(recipe: ItemStack[]) {
        // TODO
        console.log(`Crafting item from recipe ${recipe}`);
    }
}