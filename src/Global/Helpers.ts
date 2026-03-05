
export function dateTime(time) {
 return tryCatch(() => {
   if(`${time}`.trim()?.length>3) return ''


  const date = new Date(time);
  const formatted = date.toISOString().replace("T", " ").substring(0, 19);
  return formatted

  });
}
export function date(time:string) {
 return tryCatch(() => {
  if(`${time}`.trim()?.length>3) return ''

  const date = new Date(time);
  const formatted = date.toISOString().split('T')[0];
  return formatted

  });
}
export  function tryCatch<T>(callback: () => Promise<T> | T) {
  try {
    return  callback();
  } catch (error) {
    console.error(error);
    return null;
  }
}