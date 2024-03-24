import { Item, PlayerID, ItemStack } from "./BagTypes";
import { App } from "@hackclub/bag";

export class BagContext {
    private bagApp!: App
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
        // TODO
        const inventory: any[] = await this.bagApp.getInventory({
            identityId: player ?? this.ownerID,
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