import express from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com"
};


admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});
const db = admin.firestore();
const app = express();
const allowedOrigins = [
  'http://localhost:3000', // Desarrollo local
  process.env.FRONTEND_URL // Dominio en Vercel
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
const SECRET_KEY = process.env.JWT_SECRET || '123asdf';

// Middleware para verificar el token y obtener el usuario
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
    rol: 'user', // Rol predeterminado
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

  const token = jwt.sign({ username, rol: userData.rol }, SECRET_KEY, { expiresIn: '10m' });
  res.json({ message: 'Login exitoso', token, rol: userData.rol });
});

// Ruta protegida para el dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenido al dashboard', user: req.user });
});

// Ruta para cerrar sesión
app.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// Crear un grupo
app.post('/groups', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }
  try {
    const newGroupRef = db.collection('GROUPS').doc();
    await newGroupRef.set({
      name,
      createdBy: req.user.username,
      members: [req.user.username],
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Grupo creado exitosamente', groupId: newGroupRef.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
});

// Agregar un usuario a un grupo
app.post('/groups/:groupId/add-member', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
  }
  try {
    const groupRef = db.collection('GROUPS').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (groupDoc.data().createdBy !== req.user.username) {
      return res.status(403).json({ error: 'Solo el creador del grupo puede agregar miembros' });
    }
    const userDoc = await db.collection('USERS').doc(username).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(username),
    });
    res.json({ message: 'Usuario agregado al grupo exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar usuario al grupo' });
  }
});

// Obtener grupos de un usuario
app.get('/groups', authenticateToken, async (req, res) => {
  try {
    const groupsSnapshot = await db.collection('GROUPS')
      .where('members', 'array-contains', req.user.username)
      .get();

    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
});

// Crear una tarea en un grupo
app.post('/groups/:groupId/tasks', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { name, description, deadline, status, assignedTo } = req.body;

  if (!name || !status || !assignedTo) {
    return res.status(400).json({ error: 'Nombre, estado y usuario asignado son obligatorios' });
  }
  try {
    const groupRef = db.collection('GROUPS').doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (groupDoc.data().createdBy !== req.user.username) {
      return res.status(403).json({ error: 'Solo el creador del grupo puede crear tareas' });
    }
    if (!groupDoc.data().members.includes(assignedTo)) {
      return res.status(400).json({ error: 'El usuario asignado no es miembro del grupo' });
    }
    const newTaskRef = db.collection('TASKS').doc();
    await newTaskRef.set({
      groupId,
      name,
      description: description || '',
      deadline: deadline || null,
      status,
      assignedTo,
      createdBy: req.user.username,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Tarea creada exitosamente', taskId: newTaskRef.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// Obtener tareas de un grupo
app.get('/groups/:groupId/tasks', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  try {
    const tasksSnapshot = await db.collection('TASKS')
      .where('groupId', '==', groupId)
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

// Actualizar una tarea
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, deadline, status, category } = req.body;

  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    // Verificar si el usuario es el creador del grupo
    const groupRef = db.collection('GROUPS').doc(taskDoc.data().groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (groupDoc.data().createdBy !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea' });
    }
    const updatedData = {
      name: name || taskDoc.data().name,
      description: description || taskDoc.data().description,
      deadline: deadline || taskDoc.data().deadline,
      status: status || taskDoc.data().status,
      category: category || taskDoc.data().category || '', // Valor por defecto para category
    };
    await taskRef.update(updatedData);
    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar la tarea:', error); // Log del error para depuración, ya que tuve errores con un campo
    res.status(500).json({ error: 'Error al actualizar la tarea', details: error.message });
  }
});

// Actualizar el estado de una tarea
app.put('/tasks/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'El estado es obligatorio' });
  }
  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    // Verificar si el usuario es el creador del grupo o el asignado a la tarea
    const groupRef = db.collection('GROUPS').doc(taskDoc.data().groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (groupDoc.data().createdBy !== req.user.username && taskDoc.data().assignedTo !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea' });
    }
    await taskRef.update({ status });
    res.json({ message: 'Estado de la tarea actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado de la tarea' });
  }
});

// Eliminar una tarea
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const taskRef = db.collection('TASKS').doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    // Verificar si el usuario es el creador del grupo
    const groupRef = db.collection('GROUPS').doc(taskDoc.data().groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (groupDoc.data().createdBy !== req.user.username) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea' });
    }
    await taskRef.delete();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});
// Middleware para verificar si el usuario es admin
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

// Endpoint para modificar un usuario
app.put('/users/:username', authenticateToken, isAdmin, async (req, res) => {
  const { username } = req.params;
  const { email, rol } = req.body;

  try {
    const userRef = db.collection('USERS').doc(username);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updatedData = {
      email: email || userDoc.data().email,
      rol: rol || userDoc.data().rol,
    };

    await userRef.update(updatedData);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});
app.post('/create-admin', async (req, res) => {
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
    rol: 'admin', // Rol de admin
  });

  res.status(201).json({ message: 'Admin creado exitosamente' });
});

app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('USERS').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));


