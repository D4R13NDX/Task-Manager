import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Modal, Form, Input, Select, List, Card, message, DatePicker } from 'antd';
import { PlusOutlined, TeamOutlined, QuestionCircleOutlined, AppstoreAddOutlined, UserAddOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const { Sider, Content } = Layout;
const { Option } = Select;

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    if (!token) {
      navigate('/login'); // Redirigir al login si no hay token
    }
  }, [navigate, token]);

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  useEffect(() => {
    if (selectedGroup) {
      fetchTasks(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].id);
      }
    } catch (error) {
      message.error('Error al cargar grupos');
    }
  };

  const fetchTasks = async (groupId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/groups/${groupId}/tasks`, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks(response.data);
    } catch (error) {
      message.error('Error al cargar tareas');
      console.error("Error details:", error.response?.data);
    }
  };

  const handleAddTask = async (values) => {
    if (!selectedGroup) {
      message.error('Debes seleccionar un grupo para crear una tarea');
      return;
    }
  
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/groups/${selectedGroup}/tasks`, 
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success('Tarea creada');
      fetchTasks(selectedGroup);
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error('Error al crear tarea');
      console.error("Error details:", error.response?.data);
    }
  };

  const handleCreateGroup = async (values) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/groups`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Grupo creado');
      fetchGroups();
      setIsGroupModalOpen(false);
      groupForm.resetFields();
    } catch (error) {
      message.error('Error al crear grupo');
    }
  };

  const handleAddMember = async (values) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/groups/${selectedGroup}/add-member`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Usuario agregado al grupo');
      fetchGroups();
      setIsAddMemberModalOpen(false);
      addMemberForm.resetFields();
    } catch (error) {
      message.error('Error al agregar usuario al grupo');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    editForm.setFieldsValue({
      ...task,
      deadline: task.deadline ? moment(task.deadline) : null,
    });
    setIsEditModalOpen(true);
  };

  const handleEditTask = async (values) => {
    try {
      const updatedTask = {
        name: values.name || '',
        description: values.description || '',
        deadline: values.deadline || null,
        status: values.status || 'In Progress',
        category: values.category || '',
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tasks/${editingTask.id}`,
        updatedTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Tarea actualizada');
      fetchTasks(selectedGroup);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar la tarea:', error.response?.data || error.message);
      message.error('Error al actualizar la tarea');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tarea eliminada');
      fetchTasks(selectedGroup);
    } catch (error) {
      message.error('Error al eliminar tarea');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/tasks/${draggableId}/status`,
        { status: destination.droppableId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Estado de la tarea actualizado');
      fetchTasks(selectedGroup);
    } catch (error) {
      message.error('Error al actualizar el estado de la tarea');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Borrar el token al cerrar sesión
    message.success('Sesión cerrada exitosamente');
    navigate('/login'); // Redirigir al login
  };

  const KanbanBoard = ({ tasks, onEditTask, onDeleteTask }) => {
    const columns = {
      'In Progress': tasks.filter(task => task.status === 'In Progress'),
      'Done': tasks.filter(task => task.status === 'Done'),
      'Paused': tasks.filter(task => task.status === 'Paused'),
      'Revision': tasks.filter(task => task.status === 'Revision'),
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {Object.entries(columns).map(([status, tasks]) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '8px' }}
                >
                  <h3>{status}</h3>
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <Card
                            title={task.name}
                            extra={<span>{task.status}</span>}
                            actions={[
                              <Button type="link" onClick={() => onEditTask(task)}>Editar</Button>,
                              <Button type="link" danger onClick={() => onDeleteTask(task.id)}>Eliminar</Button>,
                            ]}
                          >
                            <p>{task.description}</p>
                            <p><strong>Categoría:</strong> {task.category}</p>
                            <p><strong>Fecha límite:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'No definida'}</p>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ backgroundColor: '#333' }}>
        <Menu mode="inline" defaultSelectedKeys={['1']} theme="dark" style={{ height: '100%', borderRight: 0 }}>
          <Menu.Item key="1" icon={<TeamOutlined />}>Nosotros</Menu.Item>
          <Menu.Item key="2" icon={<QuestionCircleOutlined />}>Soporte</Menu.Item>
          <Menu.Item key="3" icon={<AppstoreAddOutlined />}>Productos</Menu.Item>
          <Menu.Item key="4" icon={<LogoutOutlined />} onClick={handleLogout}>
            Cerrar sesión
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: '0 24px 24px' }}>
        <Content style={{ padding: 24, margin: 0, minHeight: 280, backgroundColor: '#f0f2f5' }}>
          <h2>Dashboard</h2>
          <div style={{ marginBottom: '16px' }}>
            <Select
              value={selectedGroup}
              onChange={(value) => setSelectedGroup(value)}
              style={{ width: '200px', marginRight: '16px' }}
            >
              {groups.map(group => (
                <Option key={group.id} value={group.id}>{group.name}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsGroupModalOpen(true)}>
              Crear Grupo
            </Button>
            <Button
              type="default"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddMemberModalOpen(true)}
              style={{ marginLeft: '8px' }}
            >
              Agregar Miembro
            </Button>
          </div>
          <KanbanBoard
            tasks={tasks}
            onEditTask={openEditModal}
            onDeleteTask={deleteTask}
          />
        </Content>
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          style={{ position: 'fixed', bottom: 30, right: 30 }}
          onClick={() => setIsModalOpen(true)}
        />
      </Layout>

      {/* Modal para agregar tarea */}
      <Modal title="Nueva Tarea" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddTask}>
          <Form.Item name="name" label="Nombre de la tarea" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="deadline" label="Fecha límite">
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          <Form.Item name="status" label="Estado" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Select>
              <Option value="In Progress">En progreso</Option>
              <Option value="Done">Hecho</Option>
              <Option value="Paused">Pausado</Option>
              <Option value="Revision">Revisión</Option>
            </Select>
          </Form.Item>
          <Form.Item name="assignedTo" label="Asignar a" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Guardar</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para crear grupo */}
      <Modal title="Crear Grupo" open={isGroupModalOpen} onCancel={() => setIsGroupModalOpen(false)} footer={null}>
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item name="name" label="Nombre del grupo" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Crear</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para agregar miembro */}
      <Modal title="Agregar Miembro" open={isAddMemberModalOpen} onCancel={() => setIsAddMemberModalOpen(false)} footer={null}>
        <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="username" label="Nombre de usuario" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Agregar</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para editar tarea */}
      <Modal title="Editar Tarea" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEditTask}>
          <Form.Item name="name" label="Nombre de la tarea" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="deadline" label="Fecha límite">
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          <Form.Item name="status" label="Estado" rules={[{ required: true, message: 'Campo obligatorio' }]}>
            <Select>
              <Option value="In Progress">En progreso</Option>
              <Option value="Done">Hecho</Option>
              <Option value="Paused">Pausado</Option>
              <Option value="Revision">Revisión</Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="Categoría">
            <Input placeholder="Sin categoría" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Actualizar</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DashboardPage;