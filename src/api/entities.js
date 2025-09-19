import { db, supabase } from '../lib/supabase';

// Event entity
export const Event = {
  async list(orderBy = '-created_at') {
    return await db.events.list(orderBy);
  },
  
  async create(eventData) {
    return await db.events.create(eventData);
  },
  
  async update(id, eventData) {
    return await db.events.update(id, eventData);
  },
  
  async delete(id) {
    return await db.events.delete(id);
  },
  
  async filter(filters) {
    // Handle the case where created_by might be an email instead of UUID
    if (filters.created_by && typeof filters.created_by === 'string' && filters.created_by.includes('@')) {
      // If it's an email, get the user ID first
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        filters.created_by = user.id;
      }
    }
    return await db.events.filter(filters);
  },
  
  async findById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async get(id) {
    return await this.findById(id);
  }
};

// MediaItem entity
export const MediaItem = {
  async list(orderBy = '-created_at') {
    return await db.mediaItems.list(orderBy);
  },
  
  async create(mediaData) {
    return await db.mediaItems.create(mediaData);
  },
  
  async filter(filters) {
    return await db.mediaItems.filter(filters);
  },
  
  async delete(id) {
    return await db.mediaItems.delete(id);
  },
  
  async update(id, mediaData) {
    const { data, error } = await supabase
      .from('media_items')
      .update(mediaData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// HighlightCategory entity
export const HighlightCategory = {
  async list(orderBy = '-created_at') {
    const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
    const ascending = !orderBy.startsWith('-');
    
    const { data, error } = await supabase
      .from('highlight_categories')
      .select('*')
      .order(column, { ascending });
    
    if (error) throw error;
    return data;
  },
  
  async create(categoryData) {
    const { data, error } = await supabase
      .from('highlight_categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async filter(filters) {
    let query = supabase.from('highlight_categories').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  async delete(id) {
    const { error } = await supabase
      .from('highlight_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  async update(id, categoryData) {
    const { data, error } = await supabase
      .from('highlight_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// GuestWish entity (placeholder - can be extended as needed)
export const GuestWish = {
  async list(orderBy = '-created_at') {
    return await db.guestWishes.list(orderBy);
  },

  async create(wishData) {
    return await db.guestWishes.create(wishData);
  },
  
  async filter(filters) {
    return await db.guestWishes.filter(filters);
  },

  async update(id, wishData) {
    return await db.guestWishes.update(id, wishData);
  },

  async delete(id) {
    return await db.guestWishes.delete(id);
  },

  async findById(id) {
    return await db.guestWishes.findById(id);
  }
};

// EventNotification entity
export const EventNotification = {
  async list(orderBy = '-created_at') {
    const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
    const ascending = !orderBy.startsWith('-');
    
    // Fix column name mismatch
    const fixedColumn = column === 'created_date' ? 'created_at' : column;
    
    console.log(`📊 EventNotification.list: ordering by ${fixedColumn}, ascending: ${ascending}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order(fixedColumn, { ascending });
    
    if (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
    
    console.log(`✅ Successfully fetched ${data?.length || 0} notifications`);
    return data;
  },
  
  async create(notificationData) {
    console.log('📝 Creating notification:', notificationData);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
    
    console.log('✅ Notification created successfully:', data);
    return data;
  },
  
  async filter(filters) {
    let query = supabase.from('notifications').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  async update(id, updateData) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    return await this.update(id, { is_read: true });
  },

  async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    
    if (error) throw error;
    return true;
  }
};

// User auth
export const User = {
  async me() {
    return await db.users.me();
  },
  
  async login() {
    return await db.users.login();
  },
  
  async logout() {
    return await db.users.logout();
  }
};

// File upload utility
export const UploadFile = async ({ file }) => {
  return await db.uploadFile(file);
};