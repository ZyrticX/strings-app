import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-e3Dc'

console.log('🏠 Running locally with Supabase configuration:');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Using local development keys');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Users table operations
  users: {
    async me() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      // Return user with additional properties for compatibility
      if (user) {
        // Try to get role from user metadata first, then from users table
        let userRole = user.user_metadata?.role || 'user';
        let fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
        
        // Also check the public.users table for role as fallback
        try {
          const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
          
          if (!userError && userRecord) {
            // Use public table data as fallback if metadata doesn't have role
            if (!user.user_metadata?.role && userRecord.role) {
              userRole = userRecord.role;
              console.log('📋 Using role from public.users table:', userRecord.role);
            }
            if (!fullName || fullName === user.email) {
              fullName = userRecord.full_name || fullName;
            }
          }
        } catch (e) {
          console.log('Could not fetch user from users table:', e);
        }
        
        const finalUser = {
          ...user,
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: userRole  // This comes last to override any role from ...user
        };
        
        console.log('🔍 User data loaded:', {
          email: finalUser.email,
          role: finalUser.role,
          metadata_role: user.user_metadata?.role,
          full_name: finalUser.full_name,
          debug_metadata: user.user_metadata,
          debug_userRole_calc: userRole
        });
        
        return finalUser;
      }
      return user
    },
    
    async login() {
      // Store the current page for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
      return data
    },
    
    async logout() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  },

  // Events table operations  
  events: {
    async list(orderBy = '-created_at') {
      const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy
      const ascending = !orderBy.startsWith('-')
      
      // Fix column name mismatch - convert created_date to created_at
      const fixedColumn = column === 'created_date' ? 'created_at' : column
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order(fixedColumn, { ascending })
      
      if (error) throw error
      return data
    },
    
    async create(eventData) {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async update(id, eventData) {
      console.log('🔄 Updating event:', id, 'with data:', eventData);
      
      // First check if event exists
      const { data: existingEvent, error: checkError } = await supabase
        .from('events')
        .select('id, created_by')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('❌ Error checking if event exists:', checkError);
        throw checkError;
      }
      
      if (!existingEvent) {
        console.error('❌ Event not found:', id);
        throw new Error(`Event with ID ${id} not found`);
      }
      
      console.log('✅ Event exists:', existingEvent);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ Error getting current user:', userError);
        throw userError;
      }
      
      console.log('👤 Current user:', user?.id, 'Event owner:', existingEvent.created_by);
      
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Error updating event:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No data returned after update - likely RLS issue');
        throw new Error(`Event with ID ${id} not found or no permission to update`);
      }
      
      console.log('✅ Event updated successfully:', data[0]);
      return data[0];
    },
    
        async delete(id) {
          console.log(`🗑️ Starting deletion process for event: ${id}`);
          
          // First check if event exists
          const { data: existingEvent, error: checkError } = await supabase
            .from('events')
            .select('id, name, created_by')
            .eq('id', id)
            .single();
          
          if (checkError) {
            console.error(`❌ Error checking event existence:`, checkError);
            if (checkError.code === 'PGRST116') {
              throw new Error(`Event with ID ${id} not found`);
            }
            throw checkError;
          }
          
          if (!existingEvent) {
            console.error(`❌ Event ${id} not found in database`);
            throw new Error(`Event with ID ${id} not found`);
          }
          
          console.log(`✅ Event found: ${existingEvent.name} (${existingEvent.id})`);
          
          // Delete related data first (to avoid foreign key constraints)
          const deletionSteps = [
            { name: 'notifications', table: 'notifications' },
            { name: 'guest_wishes', table: 'guest_wishes' },
            { name: 'media_items', table: 'media_items' },
            { name: 'highlight_categories', table: 'highlight_categories' }
          ];
          
          for (const step of deletionSteps) {
            console.log(`🔍 Deleting ${step.name} for event ${id}...`);
            
            // First count how many records exist
            const { count, error: countError } = await supabase
              .from(step.table)
              .select('*', { count: 'exact', head: true })
              .eq('event_id', id);
            
            if (countError) {
              console.warn(`⚠️ Error counting ${step.name}:`, countError);
            } else {
              console.log(`📊 Found ${count || 0} ${step.name} records to delete`);
            }
            
            // Now delete
            const { error: deleteError, count: deletedCount } = await supabase
              .from(step.table)
              .delete({ count: 'exact' })
              .eq('event_id', id);
            
            if (deleteError) {
              console.warn(`⚠️ Error deleting ${step.name}:`, deleteError);
              // Don't throw - continue with other deletions
            } else {
              console.log(`✅ Deleted ${deletedCount || 0} ${step.name} records`);
            }
          }
          
          // Finally delete the event itself
          console.log(`🎯 Deleting main event record: ${id}`);
          const { error: eventError } = await supabase
            .from('events')
            .delete()
            .eq('id', id);
          
          if (eventError) {
            console.error(`❌ Failed to delete event:`, eventError);
            throw eventError;
          }
          
          console.log(`🎉 Successfully deleted event ${id} and all related data`);
          return true;
        },
    
    async filter(filters) {
      let query = supabase.from('events').select('*')
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query
      if (error) throw error
      return data
    }
  },

  // Media items table operations
  mediaItems: {
    async list(orderBy = '-created_at') {
      const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy
      const ascending = !orderBy.startsWith('-')
      
      // Fix column name mismatch - convert created_date to created_at
      const fixedColumn = column === 'created_date' ? 'created_at' : column
      
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order(fixedColumn, { ascending })
      
      if (error) throw error
      return data
    },
    
    async create(mediaData) {
      const { data, error } = await supabase
        .from('media_items')
        .insert([mediaData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async filter(filters) {
      let query = supabase.from('media_items').select('*')
      
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },
  guestWishes: {
    async list(orderBy = '-created_at') {
      const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy
      const ascending = !orderBy.startsWith('-')
      const { data, error } = await supabase
        .from('guest_wishes')
        .select('*')
        .order(column, { ascending })
      if (error) throw error
      return data
    },
    async create(wishData) {
      const { data, error } = await supabase
        .from('guest_wishes')
        .insert([wishData])
        .select()
        .single()
      if (error) throw error
      return data
    },
    async filter(filters) {
      let query = supabase.from('guest_wishes').select('*')
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      const { data, error } = await query
      if (error) throw error
      return data
    },
    async update(id, wishData) {
      const { data, error } = await supabase
        .from('guest_wishes')
        .update(wishData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async delete(id) {
      const { error } = await supabase
        .from('guest_wishes')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    },
    async findById(id) {
      const { data, error } = await supabase
        .from('guest_wishes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  },

  // File upload operations
  async uploadFile(file, bucket = 'media') {
    // Clean file name for Supabase storage - remove special characters and Hebrew
    const cleanFileName = file.name
      .replace(/[^\w.-]/g, '_') // Replace non-alphanumeric characters with underscore
      .replace(/_{2,}/g, '_')   // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
      .toLowerCase()
    
    const fileName = `${Date.now()}_${cleanFileName}`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    return {
      file_url: publicUrl,
      thumbnail_url: publicUrl // For simplicity, using same URL for thumbnail
    }
  }
}
