import { AES } from "https://deno.land/x/god_crypto/aes.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

const { k } = parse(Deno.args);

const aes = new AES("Hello World AES!", {
  mode: "cbc",
  iv: k,
});

export async function Encrypt(str: string): Promise<string> {
  const ret = await aes.encrypt(str);
  return ret.hex();
}

export async function Decrypt(str: string): Promise<string> {
  const ret = await aes.decrypt(fromHexString(str));
  return ret.toString();
}

const fromHexString = (hexString: string) =>
  new Uint8Array(
    (hexString.match(/.{1,2}/g) as RegExpMatchArray).map((byte) =>
      parseInt(byte, 16)
    ),
  );
