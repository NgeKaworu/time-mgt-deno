export const T_Tag = "t_tag";
import type { ObjectId } from "https://deno.land/x/mongo/mod.ts";
export interface TagSchema {
  _id: ObjectId;
  uid: ObjectId;
  name: string;
  color: string;
  createAt: Date;
  updateAt: Date;
}
