// small helper so controllers can do: throw httpError(404, "Not found")
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = httpError;
