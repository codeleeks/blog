export function throwErrorJson(status, message) {
  throw new Error(JSON.stringify({
    isError: true,
    status,
    message,
  }))
}