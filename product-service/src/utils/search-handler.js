/**
 * Xây filter tìm kiếm theo danh sách field.
 * @param {string} keyword  – Từ khóa tìm kiếm.
 * @param {string[]} fields – Các trường cần so khớp (mặc định rỗng).
 * @returns {object}        – Điều kiện $or (hoặc object rỗng nếu không có keyword).
 */
const searchingHandler = (keyword = "", fields = []) => {
  if (!keyword.trim() || !fields.length) return {};

  const regex = new RegExp(keyword.trim(), "i"); // không phân biệt hoa/thường
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

export default searchingHandler;
