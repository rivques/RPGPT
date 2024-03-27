import { Item, PlayerID, ItemStack, BagResult, BagError } from "./BagTypes";
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
    private handleBagError(e: unknown, activity: string): BagError {
        if (e instanceof Error) {
            return {
                status: "error",
                error_message: `Bag api error ${activity}: ${e.message}`
            }
        }
        return {
            status: "error",
            error_message: `Bag api error ${activity} (type not Error): ${e}`
        }
    }
    async getInventory(player: PlayerID | undefined, itemFilter: Item[], includeAbsentFilteredItems: boolean = true): Promise<ItemStack[]> {
        let inventory;
        try {
            inventory = await this.bagApp.getInventory({
                identityId: player ?? this.ownerID,
                available: true
            })
        } catch (e: unknown) {
            console.error(`Error getting inventory: ${e}`)
            return [{
                item: "inventory contents unknown",
                quantity: 0
            }]
        }
        console.log("inventory:")
        console.log(inventory)
        let result: ItemStack[] = [] // convert from bag's Instance[] to ItemStack[]
        inventory.forEach((item) => {
            if (item.itemId === undefined || item.quantity === undefined) {
                console.warn(`Item ${item} from ${player ?? this.ownerID}'s inventory is missing itemId or quantity`)
            }
            result.push({
                item: item.itemId ?? "unknown",
                quantity: item.quantity ?? 0
            })
        })
        result = result.filter((item) => itemFilter.includes(item.item))
        if (includeAbsentFilteredItems) { // show item: 0 for items in filter but not in inventory, this can help the LLM know what it wants
            itemFilter.forEach((item) => {
                if (!result.some((instance) => instance.item === item)) {
                    result.push({
                        item: item,
                        quantity: 0
                    })
                }
            })
        }
        return result
    }
    async proposeTrade(receiver: PlayerID, itemsToGive: ItemStack[], itemsToReceive: ItemStack[]): Promise<BagResult<undefined>> {
        let ourInventory;
        let theirInventory;
        try { // i'm sure there's a better way to do this error handling, but this works
            ourInventory = await this.bagApp.getInventory({
                identityId: this.ownerID,
                available: true
            })
        } catch (e: unknown) {
            return this.handleBagError(e, "getting inventory");
        }
        try {
            theirInventory = await this.bagApp.getInventory({
                identityId: receiver,
                available: true
            })
        } catch (e: unknown) {
            return this.handleBagError(e, "getting inventory");
        }
        let convertedItemsToGive =[]
        for (let item of itemsToGive) {
            const itemFull = ourInventory.find((instance) => instance.itemId === item.item)
            if (itemFull === undefined) {
                return {
                    status: "error",
                    error_message: `Item ${item.item} not found in inventory of <@${this.ownerID}>`
                }
            }
            convertedItemsToGive.push({
                id: itemFull.id,
                quantity: item.quantity
            })
        }
        console.log("converted items to give: ")
        console.log(convertedItemsToGive)
        let convertedItemsToReceive = [];
        for (let item of itemsToReceive) {
            console.log(`finding item ${item.item} among ${theirInventory}`)
            const itemFull = theirInventory.find((instance) => instance.itemId === item.item)
            if (itemFull === undefined) {
                return {
                    status: "error",
                    error_message: `Item ${item.item} not found in inventory of <@${receiver}>`
                }
            }
            convertedItemsToReceive.push({
                id: itemFull.id,
                quantity: item.quantity
            })
        }
        console.log("converted items to receive: ")
        console.log(convertedItemsToReceive)
        let trade;
        try {
            trade = await this.bagApp.createTrade({
                initiator: this.ownerID,
                receiver: receiver,
            })
        } catch (e: unknown) {
            return this.handleBagError(e, "creating trade");
        }
        console.log("new trade: ")
        console.log(trade)
        await this.bagApp.updateTrade({ // convert from our itemstack into the bag app's item representation
            tradeId: trade.id,
            identityId: this.ownerID,
            add: convertedItemsToGive
        })
        await this.bagApp.updateTrade({
            tradeId: trade.id,
            identityId: receiver,
            add: convertedItemsToReceive
        })
        console.log("updated trade")
        await this.bagApp.closeTrade({
            tradeId: trade.id
        })
        console.log("closed trade:")
        console.log(trade)
        return {
            status: "success",
            result: undefined
        }
    }
}