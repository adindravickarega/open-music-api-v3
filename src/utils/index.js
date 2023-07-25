const mapDBToModel = ({
  id,
  name,
  year,
  coverUrl,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year,
  coverUrl,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = {mapDBToModel};