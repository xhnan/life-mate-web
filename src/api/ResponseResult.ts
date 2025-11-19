export interface ResponseResult<T = unknown> {
  success: boolean;
  data: T;
  code: string | number;
  message: string;
}

export function isResponseResult(x: any): x is ResponseResult<unknown> {
  return (
    x &&
    typeof x === "object" &&
    "success" in x &&
    "code" in x &&
    "message" in x
  );
}
