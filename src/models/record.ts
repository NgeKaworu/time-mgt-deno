export const T_Record = "t_record";
import { ObjectId } from "https://deno.land/x/mongo/mod.ts";

export interface RecordSchema {
  _id: ObjectId;
  uid: ObjectId;
  tid?: ObjectId[];
  event: string;
  createAt: Date;
  updateAt: Date;
  deration: number;
}

const recordMap: { [k: string]: Function } = {
  _id: ObjectId,
  uid: ObjectId,
  tid: (arr: string[]) => arr.map(ObjectId),
  event: (str: string) => str,
  createAt: (d: string | Date) => new Date(d),
  updateAt: (d: string | Date) => new Date(d),
  deration: (t: number) => t,
};

export function RecordSchema(obj: { [k: string]: any }) {
  return Object.keys(recordMap).reduce(
    (acc: { [k: string]: any }, cur: string) => {
      if (obj[cur]) {
        acc[cur] = recordMap[cur](obj[cur]);
      }
      return acc;
    },
    {},
  );
}
