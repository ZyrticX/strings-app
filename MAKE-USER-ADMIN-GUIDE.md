# 👑 Making a User Admin in Supabase

## Method 1: Direct Database Update (Recommended)

### Step 1: Update User in Supabase Dashboard
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/projects
2. **Click your project**: `jipyufhgjsuqqblzhvzo`
3. **Go to Table Editor** → **users** table
4. **Find your user**: Look for `evgeniyphotos1@gmail.com`
5. **Edit the row**:
   - Set **role** = `admin`
   - Set **full_name** = `Admin User` (optional)
6. **Save changes**

### Step 2: Update User Metadata (Alternative)
1. **Go to Authentication** → **Users**
2. **Find your user**: `evgeniyphotos1@gmail.com`
3. **Click on the user**
4. **Edit Raw User Meta Data**:
   ```json
   {
     "role": "admin",
     "full_name": "Admin User"
   }
   ```
5. **Save**

## Method 2: SQL Command

### Run SQL in Supabase SQL Editor:

```sql
-- Option 1: Update users table (if user exists)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'evgeniyphotos1@gmail.com';

-- Option 2: Insert user if doesn't exist in users table
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    auth.users.id,
    'evgeniyphotos1@gmail.com',
    'Admin User',
    'admin'
FROM auth.users 
WHERE auth.users.email = 'evgeniyphotos1@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Option 3: Update auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'evgeniyphotos1@gmail.com';
```

## Method 3: Create Admin via App Code (Development)

### Temporary Admin Creator (for development):

Create this file temporarily:

```javascript
// create-admin.js (temporary file)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jipyufhgjsuqqblzhvzo.supabase.co'
const supabaseServiceKey = 'your_service_role_key_here' // Use service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeAdmin() {
    try {
        // Update user in auth.users
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const user = users.users.find(u => u.email === 'evgeniyphotos1@gmail.com')
        if (!user) {
            console.log('User not found')
            return
        }
        
        // Update user metadata
        const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { role: 'admin' }
        })
        
        if (error) throw error
        
        console.log('User updated to admin:', data)
        
        // Also update users table
        const { error: tableError } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                email: user.email,
                role: 'admin',
                full_name: user.user_metadata?.full_name || 'Admin User'
            })
            
        if (tableError) throw tableError
        
        console.log('✅ User is now admin!')
        
    } catch (error) {
        console.error('Error:', error)
    }
}

makeAdmin()
```

## What Being Admin Gives You

### Admin Features in Your App:
- ✅ **View All Events**: See events from all users, not just your own
- ✅ **Admin Dashboard**: Access to `/AdminDashboard` 
- ✅ **Media Management**: Approve/reject uploaded media
- ✅ **User Management**: View all users and their activities
- ✅ **System Statistics**: View app usage statistics

### Admin Checks in Code:
```javascript
// In your app, admin checks look like:
if (user.role === 'admin') {
    // Show admin features
    fetchAllEvents();
} else {
    // Show only user's events
    fetchUserEvents(user.id);
}
```

## Recommended Approach: SQL Method

**I recommend using the SQL method as it's fastest:**

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this query**:
   ```sql
   -- Make evgeniyphotos1@gmail.com an admin
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'evgeniyphotos1@gmail.com';
   
   -- Also update the users table
   INSERT INTO public.users (id, email, full_name, role)
   SELECT 
       auth.users.id,
       'evgeniyphotos1@gmail.com',
       'Admin User',
       'admin'
   FROM auth.users 
   WHERE auth.users.email = 'evgeniyphotos1@gmail.com'
   ON CONFLICT (id) 
   DO UPDATE SET role = 'admin';
   ```
3. **Click "Run"**
4. **Refresh your app**

## Verify Admin Status

### After making changes:
1. **Refresh your app**: http://localhost:5173
2. **Check browser console**: Should show `role: 'admin'`
3. **Navigation**: Should see admin menu items
4. **URL test**: Try `/AdminDashboard` - should work

---

🎯 **Choose Method 1 (SQL) for quickest results!**
