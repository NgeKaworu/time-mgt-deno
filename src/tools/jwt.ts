import type {
  Context,
} from "https://deno.land/x/oak/mod.ts";

import { validateJwt } from "https://deno.land/x/djwt/validate.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import type { PayloadObject } from "https://deno.land/x/djwt/create.ts";
import { RetFail } from "./resultor.ts";
import {
  makeJwt,
  setExpiration,
  Jose,
  Payload,
} from "https://deno.land/x/djwt/create.ts";

const { k: key } = parse(Deno.args);

export async function JWT(ctx: Context, next: () => Promise<void>) {
  const jwt = ctx.request.headers.get("Authorization") || "";
  const vJwt = await validateJwt(
    { jwt, key, algorithm: "HS256" },
  );
  if (vJwt.isValid) {
    const { aud } = vJwt.payload as PayloadObject;
    ctx.request.headers.set("uid", aud as string);
    await next();
  } else {
    return RetFail(ctx, "身份认证失败", 401);
  }
}

// GenJwt 生成一个jwt
export async function GenJwt(aud: string) {
  const payload: Payload = {
    iss: "fuRan",
    aud,
    exp: setExpiration(60 * 60 * 24 * 15),
  };

  const header: Jose = {
    alg: "HS256",
    typ: "JWT",
  };

  return await makeJwt({ header, payload, key });
}
