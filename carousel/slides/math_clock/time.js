// Date's local-time accessors follow the display computer's time zone.
export function handAngles(date) {
  const seconds = date.getSeconds()+date.getMilliseconds()/1000;
  const minutes = date.getMinutes()+seconds/60;
  const hours = date.getHours()%12+minutes/60;
  return {hour: hours*30, minute: minutes*6, second: seconds*6};
}
