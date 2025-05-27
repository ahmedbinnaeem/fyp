import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Breadcrumb } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = AntLayout;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(path => path);
    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      return {
        title: path.charAt(0).toUpperCase() + path.slice(1),
        url
      };
    });
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <AntLayout>
        <Header 
          collapsed={collapsed}
          toggle={toggleSidebar}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        />
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Breadcrumb style={{ marginBottom: '16px' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            {getBreadcrumbs().map((breadcrumb, index) => (
              <Breadcrumb.Item key={index}>{breadcrumb.title}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
        <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 