import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      message.error('Error al cargar usuarios');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      rol: user.rol,
    });
    setIsModalOpen(true);
  };

  const handleUpdateUser = async (values) => {
    try {
      await axios.put(`http://localhost:5000/users/${editingUser.username}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Usuario actualizado');
      fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      message.error('Error al actualizar el usuario');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, user) => (
        <Button type="link" onClick={() => handleEditUser(user)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table dataSource={users} columns={columns} rowKey="username" />
      <Modal
        title="Editar Usuario"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateUser}>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="rol" label="Rol">
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;