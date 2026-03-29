const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Inregistrare utilizator nou
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificam daca utilizatorul exista deja
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Acest email este deja inregistrat.' });
    }

    // Criptam parola
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cream utilizatorul in baza de date
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generam un token JWT
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token-ul expira intr-o zi
    );

    res.status(201).json({
      message: 'Utilizator inregistrat cu succes!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Eroare la inregistrare:', error.message);
    res.status(500).json({ message: 'Eroare de server la inregistrare.' });
  }
};

// Autentificare utilizator
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificam daca utilizatorul exista
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email sau parola incorecta.' });
    }

    // Verificam parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email sau parola incorecta.' });
    }

    // Generam un token JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Eroare la login:', error.message);
    res.status(500).json({ message: 'Eroare de server la login.' });
  }
};
