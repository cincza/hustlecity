export function sendOk(res, payload = {}, statusCode = 200) {
  return res.status(statusCode).json(payload);
}

export function sendError(res, message, statusCode = 400, extra = {}) {
  return res.status(statusCode).json({
    error: message,
    ...extra,
  });
}
