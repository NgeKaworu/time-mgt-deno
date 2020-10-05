import {
  Database,
  MongoClient,
} from "https://deno.land/x/mongo/mod.ts";

import { UserSchema, T_User } from "../models/user.ts";
import { TagSchema, T_Tag } from "../models/tag.ts";
import { RecordSchema, T_Record } from "../models/record.ts";

class DbEngine {
  url!: string;
  name!: string;
  client!: MongoClient;
  db!: Database;

  async Connect(url: string, dbName: string, init: boolean = false) {
    this.url = url;
    this.name = dbName;

    this.client = new MongoClient();
    this.client.connectWithUri(url);
    this.db = this.client.database("time-mgt");

    // deno 驱动无法创建索引
    init = false;
    if (init) {
      // 初始化user表
      const user = this.db.collection<UserSchema>(T_User);
      await user.createIndexes(
        [
          { keys: { email: 1 }, options: { unique: true } },
          { keys: { name: 1 } },
        ],
      );

      // 初始化tag表
      const tag = this.db.collection<TagSchema>(T_Tag);
      await tag.createIndexes(
        [{ keys: { name: 1 } }],
      );

      // 初始化record表
      const record = this.db.collection<RecordSchema>(T_Record);
      await record.createIndexes(
        [{ keys: { uid: 1 } }, { keys: { tid: 1 } }],
      );
    }
  }

  GetColl<T>(table: string) {
    return this.db.collection<T>(table);
  }
}

export const db = new DbEngine();
