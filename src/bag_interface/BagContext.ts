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
    async getInventory(player: PlayerID | undefined): Promise<ItemStack[]> {
        const inventory: any[] = await this.bagApp.getInventory({
            identityId: player ?? this.ownerID,
            available: true
        })
        let result: ItemStack[] = [] // convert from bag's Instance[] to ItemStack[]
        inventory.forEach((item) => {
            result.push({
                item: item.itemId,
                quantity: item.quantity
            })
        })
        return result;
    }
    async proposeTrade(receiver: PlayerID, itemsToGive: ItemStack[], itemsToReceive: ItemStack[]) {
        const trade = await this.bagApp.createTrade({
            initiator: this.ownerID,
            receiver: receiver,
        })
        await this.bagApp.updateTrade({ // convert from our itemstack into the bag app's item representation
            tradeId: trade.tradeId,
            identityId: this.ownerID,
            add: itemsToGive.map((item) => {
                return {
                    itemId: item.item,
                    quantity: item.quantity
                }
            })
        })
        await this.bagApp.updateTrade({
            tradeId: trade.tradeId,
            identityId: receiver,
            add: itemsToReceive.map((item) => {
                return {
                    itemId: item.item,
                    quantity: item.quantity
                }
            })
        })
        await this.bagApp.closeTrade({
            tradeId: trade.tradeId
        })
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