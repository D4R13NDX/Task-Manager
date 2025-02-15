import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials] = useState({ username: 'Darien', password: '123asdf' });
  const onFinish = (values) => {
    if (values.username === credentials.username && values.password === credentials.password) {
      message.success('Login exitoso');
      navigate('/dashboard');
    } else {
      message.error('Credenciales invalidas');
    }
  };
  return (
    <div
    style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'rgb(32,32,32)',
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
          rules={[{ required: true, message: 'Escribe el usuario' }]}
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
      </Form>
    </div>
  );
};

export default LoginPage;
