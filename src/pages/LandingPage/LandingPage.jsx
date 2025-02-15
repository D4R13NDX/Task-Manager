import React from 'react';
import { Button, Typography, Card } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const LandingPage = () => {
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
      <Card
        style={{
          width: 400,
          padding: 20,
          backgroundColor: '#333',
          borderRadius: 8,
        }}
      >
        <Title level={2} style={{ color: '#fff' }}>DOM To Do- Darien Olvera Herrera</Title>
        <Text style={{ display: 'block', marginBottom: 20, color: '#fff' }}>
          Ola
        </Text>
        <Link to="/login">
          <Button
            type="primary"
            block
            size="large"
            style={{
              backgroundColor: '#007BFF',
              borderColor: '#007BFF', 
              color: '#fff', 
            }}
          >
            Ir al Login
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default LandingPage;
