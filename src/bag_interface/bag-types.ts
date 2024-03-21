export type Item = string; // it'd be nice if there was a way to do validation here
export type PlayerID = string; // same here
export interface ItemStack {
    item: Item;
    quantity: number;
}