export type Item = string; // it'd be nice if there was a way to do validation here
export type PlayerID = string; // same here
export interface ItemStack {
    item: Item;
    quantity: number;
}

export type BagError = {
    status: "error";
    error_message: string; // intended to be shown to user
}

export type BagSuccess<T> = {
    status: "success";
    result: T;
}

export type BagResult<T> = BagError | BagSuccess<T>; // returned by bagContext