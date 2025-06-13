/**
 * Xây filter tìm kiếm theo danh sách field.
 * @param {string} keyword  – Từ khóa tìm kiếm.
 * @param {string[]} fields – Các trường cần so khớp (mặc định rỗng).
 * @returns {object}        – Điều kiện $or (hoặc object rỗng nếu không có keyword).
 */
const searching = (keyword = "", fields = []) => {
  if (!keyword.trim() || !fields.length) return {};

  const regex = new RegExp(keyword.trim(), "i"); // không phân biệt hoa/thường
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

export default searching;

/*
  Cách dùng:
  1. Tìm đến hàm get all ...

  2. khai báo biến query:
    const { searchString } = req.query;

  3. khai báo biến tìm kiếm theo keyword chỉ định (ví dụ chọn search theo code và name):
    const searching = searchingHandler(searchString, ["code", "name"]);

  4. Thêm biến searching bên trong hàm find của mongoose:
    const products = await Product.find({
      <các điều kiệm khác nếu có>,
      ...searching,
    })

  5. Enjoy
*/
