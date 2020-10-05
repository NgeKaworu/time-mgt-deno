import { db } from "../db/init.ts";
import type {
  Context,
} from "https://deno.land/x/oak/mod.ts";

import { T_Tag, TagSchema } from "../models/tag.ts";
import { RetFail, RetMissing, RetOK } from "../tools/resultor.ts";
import { CheckRequired } from "../tools/checks.ts";

import { helpers } from "https://deno.land/x/oak/mod.ts";
import { ObjectId } from "https://deno.land/x/mongo/mod.ts";
import { T_Record } from "../models/record.ts";
import type { RecordSchema } from "../models/record.ts";

export async function AddTag(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }

  const result = ctx.request.body();
  if (result.type !== "json") {
    return RetFail(ctx, "body must a json");
  }

  const value = await result.value; // an object of parsed JSON

  const missingKey = CheckRequired(value, ["name"]);
  if (missingKey.length) {
    return RetMissing(ctx, missingKey, {
      "name": "标签名不能为空",
    });
  }

  const tTag = db.GetColl<TagSchema>(T_Tag);
  try {
    const ret = await tTag.insertOne(
      {
        ...value,
        uid: ObjectId(ctx.request.headers.get("uid") as string),
        createAt: new Date(),
      },
    );
    return RetOK(ctx, ret.$oid);
  } catch (e) {
    if (e.message.match(/duplicate key error/)) {
      return RetFail(ctx, "标签名不允许重复");
    }
    return RetFail(ctx, e.message);
  }
}

export async function UpdateTag(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }

  const result = ctx.request.body();
  if (result.type !== "json") {
    return RetFail(ctx, "body must a json");
  }

  const value = await result.value; // an object of parsed JSON

  const missingKey = CheckRequired(value, ["name", "id", "color"]);
  if (missingKey.length) {
    return RetMissing(ctx, missingKey, {
      "name": "标签名不能为空",
      "id": "标签id为空",
      "color": "颜色不能为空",
    });
  }

  const tTag = db.GetColl<TagSchema>(T_Tag);

  try {
    const { modifiedCount } = await tTag.updateOne(
      { _id: ObjectId(value.id) },
      {
        "$set": {
          name: value.name,
          color: value.color,
          updateAt: new Date(),
        },
      },
    );

    if (modifiedCount === 1) {
      return RetOK(ctx, "修改成功");
    }
  } catch (e) {
    if (e.message.match(/duplicate key error/)) {
      return RetFail(ctx, "标签名不允许重复");
    }
    return RetFail(ctx, e.message);
  }

  return RetFail(ctx, "修改失败");
}

export async function DeleteTag(ctx: Context) {
  const { id } = helpers.getQuery(ctx, { mergeParams: true });
  if (!id) {
    return RetFail(ctx, "id不能为空");
  }

  const tRecord = db.GetColl<RecordSchema>(T_Record);

  const uesed = await tRecord.count({
    uid: ObjectId(ctx.request.headers.get("uid") as string),
    tid: [ObjectId(id)],
  });

  if (uesed) {
    return RetFail(ctx, "无法删除正在被使用的标签");
  }

  const tTag = db.GetColl<TagSchema>(T_Tag);

  const n = await tTag.deleteOne({ _id: ObjectId(id) });

  if (n === 1) {
    return RetOK(ctx, "删除成功");
  }

  return RetFail(ctx, "删除失败");
}

export async function FindTag(ctx: Context) {
  const { skip, limit } = helpers.getQuery(ctx, { mergeParams: true });

  const tTag = db.GetColl<TagSchema>(T_Tag);

  const list = await tTag.find({
    uid: ObjectId(ctx.request.headers.get("uid") as string),
  }).skip(+skip).limit(+limit);

  return RetOK(ctx, list);
}
