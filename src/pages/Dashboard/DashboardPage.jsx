import React from 'react';
import { Layout, Menu } from 'antd';
import { TeamOutlined, QuestionCircleOutlined, AppstoreAddOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const DashboardPage = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        style={{
          backgroundColor: '#333',
        }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          theme="dark"
          style={{
            height: '100%',
            borderRight: 0,
          }}
        >
          <Menu.Item key="1" icon={<TeamOutlined />}>
            Nosotros
          </Menu.Item>
          <Menu.Item key="2" icon={<QuestionCircleOutlined />}>
            Soporte
          </Menu.Item>
          <Menu.Item key="3" icon={<AppstoreAddOutlined />}>
            Productos
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: '0 24px 24px' }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            backgroundColor: '#f0f2f5',
          }}
        >
          <h2>Dashboard</h2>
          <p>Bienvenido al dashboard :B</p>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;
