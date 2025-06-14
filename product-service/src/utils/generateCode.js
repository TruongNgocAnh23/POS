function generateAutoCode(prefix = "HD") {
  const now = new Date();

  const pad = (num) => num.toString().padStart(2, "0");

  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  const second = pad(now.getSeconds());
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1); // tháng bắt đầu từ 0
  const year = now.getFullYear().toString().slice(-2);

  return `${prefix}${day}${month}${year}${hour}${minute}${second}`;
}

export default generateAutoCode;
