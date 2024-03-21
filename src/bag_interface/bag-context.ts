import { Item, PlayerID, ItemStack } from "./bag-types";

export class BagContext {
    say(message: string) {
        // TODO
    }
    giveItem(item: string) {
        // TODO
    }
    getInventory(player: PlayerID | undefined): ItemStack[] {
        // TODO
        return [];
    }
    craftItemFromTarget(target: Item){
        // TODO
    }
    craftItemFromRecipe(recipe: ItemStack[]){
        // TODO
    }
}