export const T_User = "t_user";
import type { ObjectId } from "https://deno.land/x/mongo/mod.ts";
export interface UserSchema {
  _id: ObjectId;
  name: string;
  pwd: string;
  email: string;
  createAt: Date;
}
