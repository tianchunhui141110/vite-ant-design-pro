import { defineMock } from './defineMock.mts';

export default defineMock({
  '/api/auth_routes': {
    '/form/advanced-form': { authority: ['admin', 'user'] },
  },
});
