import type {
  Context,
} from "https://deno.land/x/oak/mod.ts";

export function RetOK(ctx: Context, data: Object) {
  ctx.response.body = {
    ok: true,
    data,
  };
}

export function RetFail(ctx: Context, errMsg: string, status: number = 200) {
  ctx.response.body = {
    ok: false,
    errMsg,
  };
  ctx.response.status = status;
}

export function RetMissing(
  ctx: Context,
  missingKey: string[],
  messages: { [keys: string]: string },
) {
  ctx.response.body = {
    ok: false,
    errMsg: missingKey.reduce((acc, cur) => `${messages[cur]} ${acc}`, ""),
  };
}
