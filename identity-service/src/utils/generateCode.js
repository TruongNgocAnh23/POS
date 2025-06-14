function generateAutoCode(prefix = "") {
  const now = new Date();

  const pad = (num) => num.toString().padStart(2, "0");

  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  const second = pad(now.getSeconds());
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // tháng bắt đầu từ 0
  const year = now.getFullYear();

  return `${prefix}${hour}${minute}${second}${day}${month}${year}`;
}
