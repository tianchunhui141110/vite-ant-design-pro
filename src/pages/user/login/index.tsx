import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {App, Button, Form, Input} from 'antd';
import {useState} from 'react';

import {Helmet, useModel} from '@/max';
import {login} from '@/services/ant-design-pro/api';
import {AnimatedCharacters} from './AnimatedCharacters';
import FeishuIcon from './FeishuIcon';

import styles from './index.module.css';

/**
 * 校验 redirect 跳转地址，防止开放重定向攻击。
 * 仅允许同源、以 '/' 开头的相对路径。
 */
const getSafeRedirectUrl = (redirect: string | null): string => {
  if (!redirect?.startsWith('/')) return '/';

  if (redirect.startsWith('//')) return '/';

  try {
    const parsed = new URL(redirect, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
};

export default function Login() {
  const {message} = App.useApp();
  const {initialState, setInitialState} = useModel('@@initialState');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [error, setError] = useState('');

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const msg = await login({...values, type: 'account'});
      if (msg.status === 'ok') {
        message.success('登录成功');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        const redirectUrl = getSafeRedirectUrl(urlParams.get('redirect'));
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
        return;
      }
      setError('账号或密码有误，请重新输入');
    } catch {
      setError('账号或密码有误，请重新输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录到工作台</title>
      </Helmet>
      {/* 左侧：品牌视觉区 */}
      <div className={styles.leftPanel}>
        <div className={styles.leftTop}/>

        <div className={styles.charactersArea}>
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={passwordValue.length}
          />
        </div>

        <div className={styles.leftFooter}/>
        <div className={styles.decorBlur1}/>
        <div className={styles.decorBlur2}/>
        <div className={styles.decorGrid}/>
      </div>

      {/* 右侧：登录表单 */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}>
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <path
                  d="M7 14L12 9L17 14L12 19L7 14Z"
                  fill="#1E40AF"
                  fillOpacity="0.9"
                />
                <path
                  d="M13 14L18 9L21 12V16L18 19L13 14Z"
                  fill="#3B82F6"
                  fillOpacity="0.7"
                />
              </svg>
            </div>
            <span>Nexus 平台</span>
          </div>

          <div className={styles.formHeader}>
            <div className={styles.titleRow}>
              <img src="/logo.svg" alt="logo" className={styles.logo} />
              <h1 className={styles.formTitle}>登录到工作台</h1>
            </div>
            <p className={styles.formSubtitle}>
              统一接入前端平台旗下所有系统
            </p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            className={styles.form}
          >
            <div className={styles.fieldLabel}>账号</div>
            <Form.Item
              name="username"
              rules={[
                {required: true, message: '请输入账号'},
                {min: 3, message: '账号长度不能少于3个字符'},
              ]}
            >
              <Input
                prefix={
                  <UserOutlined className={styles.prefixIcon}/>
                }
                placeholder="输入您的账号"
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
            </Form.Item>

            <div className={styles.fieldLabel}>密码</div>
            <Form.Item
              name="password"
              rules={[
                {required: true, message: '请输入密码'},
                {min: 6, message: '密码长度不能少于6个字符'},
              ]}
            >
              <Input
                prefix={
                  <LockOutlined className={styles.prefixIcon}/>
                }
                type={showPassword ? 'text' : 'password'}
                placeholder="输入您的密码"
                onChange={(e) =>
                  setPasswordValue(e.target.value)
                }
                suffix={
                  <span
                    className={styles.eyeToggle}
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOutlined/>
                    ) : (
                      <EyeInvisibleOutlined/>
                    )}
                  </span>
                }
              />
            </Form.Item>

            {error && (
              <div className={styles.errorBox}>{error}</div>
            )}

            <Form.Item style={{marginBottom: 0}}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className={styles.submitBtn}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.divider}>
            <span>或</span>
          </div>

          <Button
            block
            icon={<FeishuIcon type="icon-feishu"/>}
            className={styles.googleBtn}
          >
            飞书账号一键登录
          </Button>

          <div className={styles.signupRow}>
            暂无账号？{' '}
            <a href="#" className={styles.signupLink}>
              联系管理员申请开通
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
