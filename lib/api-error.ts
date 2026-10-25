/** Browser-safe decoding of structured or legacy API errors. Never stringify an
 * unknown object into an unhelpful [object Object] message. */
export function apiErrorMessage(error:unknown,fallback:string):string {
  if(typeof error==="string")return error.trim()||fallback;
  if(error&&typeof error==="object"&&"message" in error&&typeof error.message==="string")return error.message.trim()||fallback;
  return fallback;
}
