const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('Eroare la verificarea token-ului:', error.message);
      return res.status(401).json({ message: 'Nu esti autorizat, token invalid.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Nu esti autorizat, lipseste token-ul.' });
  }
};

module.exports = { protect };
