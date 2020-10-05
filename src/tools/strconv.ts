export function FormatBool(s: string): boolean {
  if (String.prototype.toLocaleLowerCase.call(s) === "true") {
    return true;
  }

  if (String.prototype.toLocaleLowerCase.call(s) === "false") {
    return false;
  }

  throw new Error("not allow string");
}
