import React from 'react';
import LoginForm from '../components/LoginForm';

interface LoginPageProps {
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <LoginForm onLogin={onLogin} />;
};

export default LoginPage;



// import React from 'react';
// import LoginForm from '../components/LoginForm';
//
// interface LoginPageProps {
//   onLogin: (userId: number, username: string, roles: string[], token: string) => void;
// }
//
// const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
//   return <LoginForm onLogin={onLogin} />;
// };
//
// export default LoginPage;