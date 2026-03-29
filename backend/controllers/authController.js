const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Inregistrare utilizator nou
exports.register = async (req, res) => {
  console.log('[AUTH] Incercare inregistrare pentru:', req.body.email);
  try {
    const { name, email, password } = req.body;

    // Verificam daca utilizatorul exista deja
    console.log('[AUTH] Verificare existenta utilizator...');
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('[AUTH] Email deja existent.');
      return res.status(400).json({ message: 'Acest email este deja inregistrat.' });
    }

    // Criptam parola
    console.log('[AUTH] Generare salt bcrypt...');
    const salt = await bcrypt.genSalt(10);
    console.log('[AUTH] Hashing parola...');
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cream utilizatorul in baza de date
    console.log('[AUTH] Salvare utilizator in DB...');
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generam un token JWT
    console.log('[AUTH] Generare token JWT...');
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('[AUTH] Inregistrare reusita.');
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
    console.error('[AUTH] Eroare la inregistrare:', error.message);
    res.status(500).json({ message: 'Eroare de server la inregistrare.' });
  }
};

// Autentificare utilizator
exports.login = async (req, res) => {
  console.log('[AUTH] Incercare login pentru:', req.body.email);
  try {
    const { email, password } = req.body;

    // Verificam daca utilizatorul exista
    console.log('[AUTH] Cautare utilizator in DB...');
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('[AUTH] Utilizator negasit.');
      return res.status(400).json({ message: 'Email sau parola incorecta.' });
    }

    // Verificam parola
    console.log('[AUTH] Utilizator gasit. Incepe verificarea parolei...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[AUTH] Parola incorecta.');
      return res.status(400).json({ message: 'Email sau parola incorecta.' });
    }

    // Generam un token JWT
    console.log('[AUTH] Parola corecta. Generare token...');
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('[AUTH] Login reusit.');
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[AUTH] Eroare la login:', error.message);
    res.status(500).json({ message: 'Eroare de server la login.' });
  }
};
