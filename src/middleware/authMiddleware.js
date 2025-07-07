// --- src/middleware/authMiddleware.js ---

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-and-long-jwt-secret-key'; // This MUST be the same secret as in server.js

function authMiddleware(req, res, next) {
    // Get the token from the 'Authorization' header
    // The header is expected to be in the format: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized: The request lacks valid authentication credentials.
        return res.status(401).json({ error: 'No token provided. Access denied.' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // 403 Forbidden: The server understands the request but refuses to authorize it.
            // This is appropriate for an invalid or expired token.
            return res.status(403).json({ error: 'Token is not valid. Access denied.' });
        }

        // If the token is valid, we attach the payload to the request object.
        // This allows subsequent route handlers to know who the user is.
        req.user = user;

        // Pass control to the next middleware or route handler in the chain
        next();
    });
}

module.exports = authMiddleware;