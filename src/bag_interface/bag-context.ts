import { Item, PlayerID, ItemStack } from "./bag-types";

export class BagContext {
    endInteraction() {
        throw new Error("Method not implemented.");
    }
    giveItem(item: string) {
        // TODO
        console.log(`Giving item ${item}`);
    }
    getInventory(player: PlayerID | undefined): ItemStack[] {
        // TODO
        return [
            {
                item: "bread",
                quantity: 3
            },
            {
                item: "flour",
                quantity: 2
            }
        ];
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