import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

const { Title } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axios.post(`${API_URL}/login`, values);
      message.success(response.data.message);
      localStorage.setItem('token', response.data.token); // Guardar el token en localStorage

      // Redirigir según el rol del usuario
      if (response.data.rol === 'admin') {
        navigate('/admin/users'); // Redirigir a AdminUsersPage si es admin
      } else {
        navigate('/dashboard'); // Redirigir al Dashboard si es usuario normal
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Error en el login');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'radial-gradient(circle, rgba(32,32,32,1) 0%, rgba(28,54,69,1) 46%, rgba(36,109,134,1) 100%)',
      }}
    >
      <Form
        name="login"
        onFinish={onFinish}
        style={{
          width: 300,
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#333',
        }}
      >
        <Title level={3} style={{ textAlign: 'center', color: '#fff' }}>Login</Title>

        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Escribe tu usuario' }]}
        >
          <Input placeholder="Username" style={{ marginBottom: 15 }} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Escribe la contraseña' }]}
        >
          <Input.Password placeholder="Password" style={{ marginBottom: 20 }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            style={{
              backgroundColor: '#007BFF',
              borderColor: '#007BFF',
              color: '#fff',
            }}
          >
            Log in
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#fff' }}>¿No tienes una cuenta? </span>
          <Link to="/register" style={{ color: '#007BFF' }}>Regístrate aquí</Link>
        </div>
      </Form>
    </div>
  );
};

export default LoginPage;