
import { ColorSwatch } from '../types';
import { supabase } from './supabaseClient';

const AUTH_KEY = 'furnicolor_auth_config';

const DEFAULT_AUTH = {
  username: 'admin',
  password: '13142538'
};

const DEFAULT_PALETTES: ColorSwatch[] = [
  // 木纹系列 (Wood Grain) - 丰富质感
  { id: 'w1', name: '北美黑胡桃', hex: '#3B2F2F', category: '木纹', finish: 'wood' },
  { id: 'w2', name: '北美樱桃木', hex: '#8B5A2B', category: '木纹', finish: 'wood' },
  { id: 'w3', name: '原木白橡木', hex: '#D2B48C', category: '木纹', finish: 'wood' },
  { id: 'w4', name: '烟熏橡木', hex: '#4A3728', category: '木纹', finish: 'wood' },
  { id: 'w5', name: '缅甸柚木', hex: '#A0522D', category: '木纹', finish: 'wood' },
  { id: 'w6', name: '浅色水曲柳', hex: '#E3DAC9', category: '木纹', finish: 'wood' },
  
  // 纯色系列 (Solid Color) - 莫兰迪与流行色
  { id: 's1', name: '极地白', hex: '#F9FAFB', category: '纯色', finish: 'matte' },
  { id: 's2', name: '暗夜黑', hex: '#111827', category: '纯色', finish: 'matte' },
  { id: 's3', name: '奶油咖', hex: '#E6D5C3', category: '纯色', finish: 'matte' },
  { id: 's4', name: '莫兰迪绿', hex: '#8B9A8B', category: '纯色', finish: 'matte' },
  { id: 's5', name: '雾霾蓝', hex: '#778899', category: '纯色', finish: 'matte' },
  { id: 's6', name: '藕粉色', hex: '#DDBBBB', category: '纯色', finish: 'matte' },
  { id: 's7', name: '中灰色', hex: '#9CA3AF', category: '纯色', finish: 'matte' },
  
  // 金属系列 (Metallic) - 工业与奢华
  { id: 'm1', name: '香槟金', hex: '#D4AF37', category: '金属', finish: 'glossy' },
  { id: 'm2', name: '拉丝银', hex: '#C0C0C0', category: '金属', finish: 'glossy' },
  { id: 'm3', name: '玫瑰金', hex: '#B76E79', category: '金属', finish: 'glossy' },
  { id: 'm4', name: '枪黑色', hex: '#2C3539', category: '金属', finish: 'glossy' },
  { id: 'm5', name: '古铜色', hex: '#8B4513', category: '金属', finish: 'glossy' },

  // 肤感系列 (Skin Feel) - 柔雾触感
  { id: 'f1', name: '肤感白', hex: '#FFFFFF', category: '肤感', finish: 'matte' },
  { id: 'f2', name: '肤感灰', hex: '#64748B', category: '肤感', finish: 'matte' },
  { id: 'f3', name: '肤感绿', hex: '#4A5D4E', category: '肤感', finish: 'matte' },
  { id: 'f4', name: '肤感黑', hex: '#1A1A1A', category: '肤感', finish: 'matte' },
  { id: 'f5', name: '肤感杏', hex: '#F5F5DC', category: '肤感', finish: 'matte' },

  // 大理石纹系列 (Marble Grain) - 自然纹理
  { id: 'd1', name: '爵士白', hex: '#E5E7EB', category: '大理石纹', finish: 'glossy' },
  { id: 'd2', name: '劳伦黑金', hex: '#1B1B1B', category: '大理石纹', finish: 'glossy' },
  { id: 'd3', name: '鱼肚白', hex: '#FDFDFD', category: '大理石纹', finish: 'glossy' },
  { id: 'd4', name: '卡拉拉', hex: '#DCDCDC', category: '大理石纹', finish: 'glossy' },
  { id: 'd5', name: '灰网纹', hex: '#708090', category: '大理石纹', finish: 'glossy' },
];

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  credits: number;
  is_admin: boolean;
  created_at?: string;
}

export class BackendService {
  private currentUser: AppUser | null = null;

  constructor() {
    // Try to restore session from localStorage
    const savedUser = localStorage.getItem('furnicolor_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('furnicolor_user');
  }

  async verifyLogin(username: string, password: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    this.currentUser = data;
    localStorage.setItem('furnicolor_user', JSON.stringify(data));
    return data;
  }

  // Admin: Get all users
  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Admin: Create user
  async createUser(user: Partial<AppUser>): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .insert([{
        username: user.username,
        password: user.password,
        credits: user.credits || 0,
        is_admin: user.is_admin || false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Admin: Update user credits
  async updateUserCredits(userId: string, credits: number): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .update({ credits })
      .eq('id', userId);

    if (error) throw error;
  }

  // Admin: Delete user
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }

  // User: Deduct credit
  async deductCredit(userId: string): Promise<number> {
    // Use RPC for atomic deduction
    const { data, error } = await supabase
      .rpc('deduct_credits', { p_user_id: userId });

    if (error) {
      console.error('RPC Error:', error);
      throw new Error(error.message || 'Deduction failed');
    }

    const newCredits = data as number;
    
    // Update local session if it's the current user
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.credits = newCredits;
      localStorage.setItem('furnicolor_user', JSON.stringify(this.currentUser));
    }

    return newCredits;
  }

  // Refund credit (if generation failed)
  async refundCredit(userId: string): Promise<number> {
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (fetchError || !user) throw new Error('User not found');

    const newCredits = user.credits + 1;
    const { data: updatedUser, error: updateError } = await supabase
      .from('app_users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Update local session if it's the current user
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.credits = newCredits;
      localStorage.setItem('furnicolor_user', JSON.stringify(this.currentUser));
    }

    return newCredits;
  }

  // Refresh current user data from server
  async refreshUser(): Promise<AppUser | null> {
    if (!this.currentUser) return null;
    
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', this.currentUser.id)
      .single();

    if (error || !data) return null;

    this.currentUser = data;
    localStorage.setItem('furnicolor_user', JSON.stringify(data));
    return data;
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!this.currentUser) return;
    
    const { error } = await supabase
      .from('app_users')
      .update({ password: newPassword })
      .eq('id', this.currentUser.id);

    if (error) throw error;
    
    this.currentUser.password = newPassword;
    localStorage.setItem('furnicolor_user', JSON.stringify(this.currentUser));
  }


  // 获取所有分类
  async getCategories(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      // 降级：如果数据库还没建表，返回默认分类
      return [
        { id: '1', name: '木纹' },
        { id: '2', name: '纯色' },
        { id: '3', name: '金属' },
        { id: '4', name: '肤感' },
        { id: '5', name: '大理石纹' }
      ];
    }
    return data || [];
  }

  // 添加分类
  async addCategory(name: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      throw error;
    }
    return data;
  }

  // 删除分类
  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }
    return true;
  }

  // 获取所有色卡
  async getPalettes(): Promise<ColorSwatch[]> {
    try {
      const { data, error } = await supabase
        .from('palettes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // If database is empty, return default palettes (but don't save them to DB automatically to avoid duplicates)
      // In a real app, you might want to seed the DB.
      if (!data || data.length === 0) {
        return DEFAULT_PALETTES;
      }

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        hex: item.hex,
        category: item.category,
        finish: item.finish,
        imageUrl: item.image_url,
      }));
    } catch (err) {
      console.error('Error fetching palettes:', err);
      // Fallback to defaults if Supabase is not configured yet
      return DEFAULT_PALETTES;
    }
  }

  async uploadTexture(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('textures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('textures')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading texture:', err);
      return null;
    }
  }

  async addColor(color: Omit<ColorSwatch, 'id'>, file?: File): Promise<ColorSwatch> {
    let imageUrl = color.imageUrl;

    if (file) {
      const uploadedUrl = await this.uploadTexture(file);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    // Prepare data for DB (snake_case)
    const dbData = {
      name: color.name,
      hex: color.hex,
      category: color.category,
      finish: color.finish,
      image_url: imageUrl,
    };

    const { data, error } = await supabase
      .from('palettes')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error adding color:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      hex: data.hex,
      category: data.category,
      finish: data.finish,
      imageUrl: data.image_url,
    };
  }

  async updateColor(id: string, updates: Partial<ColorSwatch>, file?: File): Promise<void> {
    let imageUrl = updates.imageUrl;

    if (file) {
      const uploadedUrl = await this.uploadTexture(file);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const dbUpdates: any = {
      name: updates.name,
      hex: updates.hex,
      category: updates.category,
      finish: updates.finish,
    };

    if (imageUrl !== undefined) {
      dbUpdates.image_url = imageUrl;
    }

    const { error } = await supabase
      .from('palettes')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating color:', error);
      throw error;
    }
  }

  async deleteColor(id: string): Promise<void> {
    const { error } = await supabase
      .from('palettes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting color:', error);
      throw error;
    }
  }
}

export const backendService = new BackendService();
