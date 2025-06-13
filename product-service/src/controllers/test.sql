select
  row_number() over (order by so.created_at desc) as stt,
  p.name,
  u.username,
  b.name as branch_name,
  sum(so.details.quantity) as quantity,
  sum(so.final) as final
from saleorders so
left join products p on p._id = so.details.product
left join branches b on b._id = so.branch_id
left join users u on u._id = so.created_by
where so.created_at between '2023-06-01' and '2023-06-30'
  and so.branch = 123
  and created_by = 123
  and so.isClosed = true
  and so.isCancel = false
group by p.name, u.username, b.name