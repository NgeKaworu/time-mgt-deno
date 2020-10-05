import {
  Application,
  Router,
} from "https://deno.land/x/oak/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { db } from "./src/db/init.ts";
import { FormatBool } from "./src/tools/strconv.ts";
import { Login, Regsiter, Profile } from "./src/controller/user.ts";
import { JWT } from "./src/tools/jwt.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import {
  AddTag,
  DeleteTag,
  FindTag,
  UpdateTag,
} from "./src/controller/tag.ts";
import {
  AddRecord,
  DeleteRecord,
  FindRecord,
  UpdateRecord,
  StatisticRecord,
} from "./src/controller/record.ts";
import { RetFail } from "./src/tools/resultor.ts";

const { i: isInit, m: dbUrl, db: dbname = "time-mgt" } = parse(Deno.args);

db.Connect(dbUrl, dbname, FormatBool(isInit));

const controller = new AbortController();

const router = new Router();
router
  //user controller
  .get("/profile", JWT, Profile)
  .post("/login", Login)
  .post("/register", Regsiter)
  //tag controller
  .post("/v1/tag/create", JWT, AddTag)
  .put("/v1/tag/update", JWT, UpdateTag)
  .get("/v1/tag/list", JWT, FindTag)
  .delete("/v1/tag/:id", JWT, DeleteTag)
  //record controller
  .post("/v1/record/create", JWT, AddRecord)
  .put("/v1/record/update", JWT, UpdateRecord)
  .get("/v1/record/list", JWT, FindRecord)
  .delete("/v1/record/:id", JWT, DeleteRecord)
  .post("/v1/record/statistic", JWT, StatisticRecord);

const { signal } = controller;

const app = new Application();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    return RetFail(ctx, err.message);
  }
});
app.use(oakCors({ allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000, signal });

console.log("http close");
