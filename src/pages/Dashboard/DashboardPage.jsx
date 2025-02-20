import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Modal, Form, Input, Select, List, Card, message, DatePicker } from 'antd';
import { PlusOutlined, TeamOutlined, QuestionCircleOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Sider, Content } = Layout;
const { Option } = Select;

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      message.error('Error al cargar tareas');
    }
  };

  const handleAddTask = async (values) => {
    try {
      await axios.post('http://localhost:5000/tasks', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tarea creada');
      fetchTasks();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error('Error al crear tarea');
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
      await axios.put(`http://localhost:5000/tasks/${editingTask.id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tarea actualizada');
      fetchTasks();
      setIsEditModalOpen(false);
    } catch (error) {
      message.error('Error al actualizar tarea');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Tarea eliminada');
      fetchTasks();
    } catch (error) {
      message.error('Error al eliminar tarea');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ backgroundColor: '#333' }}>
        <Menu mode="inline" defaultSelectedKeys={['1']} theme="dark" style={{ height: '100%', borderRight: 0 }}>
          <Menu.Item key="1" icon={<TeamOutlined />}>Nosotros</Menu.Item>
          <Menu.Item key="2" icon={<QuestionCircleOutlined />}>Soporte</Menu.Item>
          <Menu.Item key="3" icon={<AppstoreAddOutlined />}>Productos</Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: '0 24px 24px' }}>
        <Content style={{ padding: 24, margin: 0, minHeight: 280, backgroundColor: '#f0f2f5' }}>
          <h2>Dashboard</h2>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item>
                <Card
                  title={task.name}
                  extra={<span>{task.status}</span>}
                  actions={[
                    <Button type="link" onClick={() => openEditModal(task)}>Editar</Button>,
                    <Button type="link" danger onClick={() => deleteTask(task.id)}>Eliminar</Button>,
                  ]}
                >
                  <p>{task.description}</p>
                  <p><strong>Categoría:</strong> {task.category}</p>
                  <p><strong>Fecha límite:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'No definida'}</p>
                </Card>
              </List.Item>
            )}
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
          <Form.Item name="category" label="Categoría">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Guardar</Button>
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
            <Input />
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