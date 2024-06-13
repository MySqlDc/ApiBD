const handleError = (err, req, res, next) => {
    const statusCode = err.statusCode || 400;
    const status = statusCode === 500 ? 'error' : 'fallo';
    const message = err.message || 'Internal Server Error';
    const errorName = err.name || 'Error';
  
    res.status(statusCode).json({
      status,
      name: errorName,
      message,
    });
};
  
  
export { handleError };
