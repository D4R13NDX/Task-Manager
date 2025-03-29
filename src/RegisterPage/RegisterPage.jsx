import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

const { Title } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await axios.post('${API_URL}/register', values);
      message.success(response.data.message);
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.error || 'Error en el registro');
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
        name="register"
        onFinish={onFinish}
        style={{
          width: 300,
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#333',
        }}
      >
        <Title level={3} style={{ textAlign: 'center', color: '#fff' }}>Registro</Title>

        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Escribe tu usuario' }]}
        >
          <Input placeholder="Username" style={{ marginBottom: 15 }} />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Escribe tu email' },
            { type: 'email', message: 'El email no es válido' },
          ]}
        >
          <Input placeholder="Email" style={{ marginBottom: 15 }} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Escribe tu contraseña' }]}
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
            Registrarse
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#fff' }}>¿Ya tienes una cuenta? </span>
          <Link to="/login" style={{ color: '#007BFF' }}>Inicia sesión aquí</Link>
        </div>
      </Form>
    </div>
  );
};

export default RegisterPage;
