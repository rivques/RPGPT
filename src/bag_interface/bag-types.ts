type Item = string; // it'd be nice if there was a way to do validation here
type PlayerID = string; // same here
interface ItemStack {
    item: Item;
    quantity: number;
}