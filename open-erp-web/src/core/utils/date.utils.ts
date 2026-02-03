export function userDateFormatString(): string {
  var date = new Date(2025, 11, 31);
  var str = date.toLocaleDateString();
  str = str.replace('31', 'dd');
  str = str.replace('12', 'mm');
  str = str.replace('2025', 'yy');
  return str;
}
