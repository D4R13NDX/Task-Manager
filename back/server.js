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

// verificar el token y obtener el usuario
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Registro de usuario
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

// Login de usuario
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

// Obtener todas las tareas del usuario autenticado
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const tasksSnapshot = await db.collection('TASKS')
      .where('username', '==', req.user.username)
      .get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las tareas' });
  }
});

// Crear una nueva tarea
app.post('/tasks', authenticateToken, async (req, res) => {
  const { name, description, deadline, status, category } = req.body;
  
  if (!name || !status) {
    return res.status(400).json({ error: 'El nombre y el estado son obligatorios' });
  }

  const validStatuses = ['In Progress', 'Done', 'Paused', 'Revision'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const newTaskRef = db.collection('TASKS').doc();
    await newTaskRef.set({
      username: req.user.username,
      name,
      description: description || '',
      deadline: deadline || null,
      status,
      category: category || '',
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Tarea creada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// Obtener una tarea por ID
app.get('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data().username !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta tarea' });
    }

    res.json({ id: taskDoc.id, ...taskDoc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
});

// Actualizar una tarea
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, deadline, status, category } = req.body;

  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data().username !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea' });
    }

    await taskRef.update({
      name: name || taskDoc.data().name,
      description: description || taskDoc.data().description,
      deadline: deadline || taskDoc.data().deadline,
      status: status || taskDoc.data().status,
      category: category || taskDoc.data().category,
    });

    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

// Eliminar una tarea
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data().username !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea' });
    }

    await taskRef.delete();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
