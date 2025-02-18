import express from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
admin.initializeApp({
  credential: admin.credential.cert('./credencialesfirebase.json'),
});
const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET || '123asdf';
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const existingUser = await db.collection('USERS').doc(username).get();
  if (existingUser.exists) {
    return res.status(400).json({ error: 'El username ya está en uso' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection('USERS').doc(username).set({
    username,
    email,
    password: hashedPassword,
  });

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const userDoc = await db.collection('USERS').doc(username).get();
  if (!userDoc.exists) {
    return res.status(400).json({ error: 'Usuario no encontrado' });
  }
  const userData = userDoc.data();
  const isValidPassword = await bcrypt.compare(password, userData.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '10m' });
  res.json({ message: 'Login exitoso', token });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
