import { Item, PlayerID, ItemStack } from "./bag-types";
import { App } from "@hackclub/bag";

export class BagContext {
    // singleton class
    private static instance: BagContext;
    private bagApp!: App
    playerID: PlayerID;
    constructor(app: App, playerID: PlayerID) {
        this.bagApp = app
        this.playerID = playerID;
    }
    giveItem(item: string) {
        // TODO
        console.log(`Giving item ${item}`);
    }
    async getInventory(player: PlayerID | undefined): Promise<ItemStack[]> {
        // TODO
        const inventory: any[] = await this.bagApp.getInventory({
            identityId: player ?? this.playerID,
            available: true
        })
        let result: ItemStack[] = []
        inventory.forEach((item) => {
            result.push({
                item: item.itemId,
                quantity: item.quantity
            })
        })
        return result;
    }
    async proposeTrade(player: PlayerID, itemsToGive: ItemStack[], itemsToReceive: ItemStack[]) {

    }
    craftItemFromTarget(target: Item){
        // TODO
        console.log(`Crafting item ${target}`);
    }
    craftItemFromRecipe(recipe: ItemStack[]){
        // TODO
        console.log(`Crafting item from recipe ${recipe}`);
    }
}