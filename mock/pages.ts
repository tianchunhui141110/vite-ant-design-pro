/**
 * 页面级 Mock 聚合入口。
 *
 * 原 umi 会自动注册 src/pages 下的页面级 _mock.ts 文件，
 * vite-plugin-mock-dev-server 只加载 mock/ 目录，
 * 因此在此统一引入页面级 Mock 并用 defineMock 转换格式。
 *
 * 新增页面 Mock 的两种方式：
 *  1. 页面内新建 _mock.ts，然后在本文件 import 并展开（保持就近放置习惯）
 *  2. 直接在 mock/ 下新建文件（推荐，无需修改本文件）
 */
import { defineMock } from './defineMock.mts';

import accountCenter from '../src/pages/account/center/_mock';
import accountSettings from '../src/pages/account/settings/_mock';
import analysis from '../src/pages/dashboard/analysis/_mock';
import monitor from '../src/pages/dashboard/monitor/_mock';
import workplace from '../src/pages/dashboard/workplace/_mock';
import advancedForm from '../src/pages/form/advanced-form/_mock';
import basicForm from '../src/pages/form/basic-form/_mock';
import stepForm from '../src/pages/form/step-form/_mock';
import basicList from '../src/pages/list/basic-list/_mock';
import cardList from '../src/pages/list/card-list/_mock';
import profileAdvanced from '../src/pages/profile/advanced/_mock';
import profileBasic from '../src/pages/profile/basic/_mock';
import register from '../src/pages/user/register/_mock';

export default defineMock({
  // account
  ...accountCenter,
  ...accountSettings,
  // dashboard
  ...analysis,
  ...monitor,
  ...workplace,
  // form
  ...advancedForm,
  ...basicForm,
  ...stepForm,
  // list
  ...basicList,
  ...cardList,
  // profile
  ...profileAdvanced,
  ...profileBasic,
  // user
  ...register,
});
