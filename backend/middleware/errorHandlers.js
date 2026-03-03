const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled API error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
