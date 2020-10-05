// 返回对象里必填但是未填的key
export function CheckRequired(
  obj: { [key: string]: any },
  keys: string | Array<string>,
): string[] {
  const temp: string[] = [];
  const required = temp.concat(keys);
  return required.filter((r) => [undefined, ""].includes(obj[r]));
}
