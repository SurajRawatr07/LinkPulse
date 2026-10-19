import { User } from '../../types';
import { db } from '../../lib/api/mockDb';
import { LocalStore } from '../../lib/api/localStore';

export const authService = {
  async getUserCount(): Promise<number> {
    return db.getUserCount();
  },

  async getCurrentUser(): Promise<User | null> {
    const session = await db.getCurrentSession();
    if (session) return session;
    return LocalStore.getCurrentUser();
  },

  async login(email: string, passwordPlain: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.login(cleanEmail, passwordPlain);
    LocalStore.setCurrentUser(user, 'local_token_' + user.id);
    return user;
  },

  async register(name: string, email: string, passwordPlain: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.register(name.trim(), cleanEmail, passwordPlain);
    LocalStore.setCurrentUser(user, 'local_token_' + user.id);
    return user;
  },

  async logout(): Promise<void> {
    await db.setSession(null);
    LocalStore.setCurrentUser(null);
    localStorage.removeItem('lp_token');
    sessionStorage.removeItem('lp_token');
  },

  async bootstrapAdmin(data: { name: string; email: string; passwordPlain: string }): Promise<User> {
    const user = await db.register(data.name, data.email, data.passwordPlain);
    // In local mode, assign admin role
    user.role = 'admin';
    await db.updateUserRole(user.id, 'admin');
    await db.setSession(user);
    LocalStore.setCurrentUser(user, 'local_token_' + user.id);
    return user;
  },
};
