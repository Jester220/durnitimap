
function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}


function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}

module.exports = { notFound, errorHandler };