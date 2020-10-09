import { db } from "../db/init.ts";
import type {
  Context,
} from "https://deno.land/x/oak/mod.ts";

import { ObjectId } from "https://deno.land/x/mongo/mod.ts";

import { T_Record, RecordSchema } from "../models/record.ts";
import { RetFail, RetMissing, RetOK } from "../tools/resultor.ts";
import { CheckRequired } from "../tools/checks.ts";

import { helpers } from "https://deno.land/x/oak/mod.ts";

export async function AddRecord(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }

  const result = ctx.request.body();
  if (result.type !== "json") {
    return RetFail(ctx, "body must a json");
  }

  const value = await result.value; // an object of parsed JSON

  const missingKey = CheckRequired(value, ["event"]);
  if (missingKey.length) {
    return RetMissing(ctx, missingKey, {
      "event": "事件不能为空",
    });
  }

  const tRecord = db.GetColl<RecordSchema>(T_Record);
  const lastRecord = await tRecord.aggregate(
    [
      { $match: { uid: ObjectId(ctx.request.headers.get("uid") as string) } },
      { $sort: { createAt: -1 } },
      { $limit: 1 },
    ],
  );

  let deration = 0;
  if (lastRecord.length) {
    deration = Date.now() -
      Date.parse((lastRecord[0] as RecordSchema)["createAt"].toString());
  }

  const ret = await tRecord.insertOne(
    RecordSchema({
      ...value,
      uid: ctx.request.headers.get("uid"),
      createAt: new Date(),
      deration,
    }),
  );
  return RetOK(ctx, ret.$oid);
}

export async function UpdateRecord(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }

  const result = ctx.request.body();
  if (result.type !== "json") {
    return RetFail(ctx, "body must a json");
  }

  const value = await result.value; // an object of parsed JSON

  const missingKey = CheckRequired(value, ["_id", "event"]);
  if (missingKey.length) {
    return RetMissing(ctx, missingKey, {
      "_id": "标签id为空",
      "event": "事件不能为空",
    });
  }

  const tRecord = db.GetColl<RecordSchema>(T_Record);

  const setter: { [k: string]: any } = RecordSchema({
    ...value,
    updateAt: new Date(),
  });

  delete setter._id;

  const { modifiedCount } = await tRecord.updateOne(
    { _id: ObjectId(value._id) },
    {
      "$set": setter,
    },
  );

  if (modifiedCount === 1) {
    return RetOK(ctx, "修改成功");
  }

  return RetFail(ctx, "修改失败");
}

export async function DeleteRecord(ctx: Context) {
  const { id } = helpers.getQuery(ctx, { mergeParams: true });
  if (!id) {
    return RetFail(ctx, "id不能为空");
  }

  const tRecord = db.GetColl<RecordSchema>(T_Record);

  const n = await tRecord.deleteOne({ _id: ObjectId(id) });

  if (n === 1) {
    return RetOK(ctx, "删除成功");
  }

  return RetFail(ctx, "删除失败");
}

export async function FindRecord(ctx: Context) {
  const { skip = 0, limit = 10 } = helpers.getQuery(ctx, { mergeParams: true });

  const tRecord = db.GetColl<RecordSchema>(T_Record);

  const list = await tRecord.aggregate(
    [
      { $match: { uid: ObjectId(ctx.request.headers.get("uid") as string) } },
      { $sort: { createAt: -1 } },
      { $skip: +skip },
      { $limit: +limit },
    ],
  );

  return RetOK(ctx, list);
}

export async function StatisticRecord(ctx: Context) {
  try {
    const result = ctx.request.body();

    const {
      dateRange = [],
      tids,
    } = await result.value || {}; // an object of parsed JSON

    const [start, end] = dateRange;

    const match: Record<string, any> = {
      uid: ObjectId(ctx.request.headers.get("uid") as string),
    };

    if (start && end) {
      match["createAt"] = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    let matchTid: ObjectId[] = [];

    if (tids?.length) {
      matchTid = tids.map((t: string) => ObjectId(t));
      match["tid"] = { $in: matchTid };
    }

    const tRecord = db.GetColl<RecordSchema>(T_Record);
    const pipe = [
      { $match: match },
      {
        $unwind: {
          path: "$tid",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $lookup: {
      //     from: "t_tag",
      //     localField: "tid",
      //     foreignField: "_id",
      //     as: "tag",
      //   },
      // },
      // { $unwind: "$tid" },
      {
        $group: {
          _id: "$tid",
          deration: { $sum: "$deration" },
          // tag: { $first: "$tag" },
        },
      },
      {
        $sort: {
          deration: -1,
        },
      },
    ];

    if (matchTid?.length) {
      pipe.push({
        $match: {
          _id: { $in: matchTid },
        },
      });
    }

    const res = await tRecord.aggregate(pipe);

    return RetOK(ctx, res);
  } catch (e) {
    return RetFail(ctx, e.message);
  }
}
