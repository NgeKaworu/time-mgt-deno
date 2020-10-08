import { db } from "../db/init.ts";
import type {
  Context,
} from "https://deno.land/x/oak/mod.ts";

import { T_User, UserSchema } from "../models/user.ts";
import { RetFail, RetMissing, RetOK } from "../tools/resultor.ts";
import { CheckRequired } from "../tools/checks.ts";
import { Encrypt } from "../tools/crypto.ts";

import { ObjectId } from "https://deno.land/x/mongo/mod.ts";
import { GenJwt } from "../tools/jwt.ts";

export async function Login(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }
  const result = ctx.request.body(); // content type automatically detected
  if (result.type === "json") {
    const value = await result.value; // an object of parsed JSON

    const missingKey = CheckRequired(value, ["email", "pwd"]);
    if (missingKey.length) {
      return RetMissing(ctx, missingKey, {
        "email": "邮箱不能为空",
        "pwd": "密码不能为空",
      });
    }

    const { pwd } = value;

    const encryptedPwd = await Encrypt(pwd);

    const tUser = db.GetColl<UserSchema>(T_User);
    try {
      const hasUser = await tUser.findOne(
        { ...value, pwd: encryptedPwd },
      );
      if (hasUser) {
        const { _id: { $oid } } = hasUser;

        const jwt = await GenJwt($oid);

        return RetOK(ctx, jwt);
      } else {
        return RetFail(ctx, "没有此用户");
      }
    } catch (e) {
      return RetFail(ctx, e.message);
    }
  } else {
    return RetFail(ctx, "body must a json");
  }
}

export async function Regsiter(ctx: Context) {
  if (!ctx.request.hasBody) {
    return RetFail(ctx, "not has body");
  }
  const result = ctx.request.body(); // content type automatically detected
  if (result.type === "json") {
    const value = await result.value; // an object of parsed JSON

    const missingKey = CheckRequired(value, ["email", "name", "pwd"]);
    if (missingKey.length) {
      return RetMissing(ctx, missingKey, {
        "email": "邮箱不能为空",
        "name": "昵称不能为空",
        "pwd": "密码不能为空",
      });
    }

    const { pwd } = value;

    const encryptedPwd = await Encrypt(pwd);

    const tUser = db.GetColl<UserSchema>(T_User);
    try {
      const { $oid } = await tUser.insertOne(
        { ...value, pwd: encryptedPwd, createAt: new Date() },
      );
      const jwt = await GenJwt($oid);

      return RetOK(ctx, jwt);
    } catch (e) {
      if (e.message.match(/duplicate key error .* email/)) {
        return RetFail(ctx, "邮箱已被注册");
      }
      return RetFail(ctx, e.message);
    }
  } else {
    return RetFail(ctx, "body must a json");
  }
}

// Profile 返回用户信息
export async function Profile(ctx: Context) {
  const tUser = db.GetColl<UserSchema>(T_User);
  const ret = await tUser.findOne(
    { _id: ObjectId(ctx.request.headers.get("uid") as string) },
  );
  const removePwd: Record<string, any> = { ...ret };
  delete removePwd.pwd;
  return RetOK(ctx, removePwd);
}
