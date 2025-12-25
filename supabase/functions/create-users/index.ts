import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserToCreate {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'receptionist' | 'consultant' | 'doctor';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGxnYmltamVtYnJoeGZubHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDAyODgsImV4cCI6MjA4MTgxNjI4OH0.Ik5Fd7Esc97mUBAwe3EkcrxhiHoZr4YOlRzhzr5rQXg';
    
    // Verify this is called with proper auth (service role or anon key in header)
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('apikey');
    
    // Allow call with anon key for initial setup
    if (!authHeader && !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const users: UserToCreate[] = [
      { username: 'Yousef', password: 'You@#2000', fullName: 'یوسف', role: 'admin' },
      { username: 'Monshi_1', password: 'Mon0912', fullName: 'منشی ۱', role: 'receptionist' },
      { username: 'Monshi_2', password: 'Mon@0912', fullName: 'منشی ۲', role: 'receptionist' },
      { username: 'Moshaver_1', password: 'Mosh@2000', fullName: 'خانم ساعی', role: 'consultant' },
      { username: 'Moshaver_2', password: 'Mosh@2001', fullName: 'خانم حضرتی', role: 'consultant' },
      { username: 'Moshaver_3', password: 'Mosh@2002', fullName: 'خانم الیاسی', role: 'consultant' },
      { username: 'Moshaver_4', password: 'Mosh@2003', fullName: 'خانم افتخاری', role: 'consultant' },
    ];

    const results = [];

    for (const user of users) {
      const email = `${user.username.toLowerCase()}@clinic.local`;
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === email);
      
      if (existingUser) {
        // Update the user's password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: user.password,
        });
        
        // Update username in user_profiles
        await supabaseAdmin
          .from('user_profiles')
          .update({ username: user.username, full_name: user.fullName })
          .eq('user_id', existingUser.id);
        
        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('*')
          .eq('user_id', existingUser.id)
          .maybeSingle();
        
        if (!existingRole) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: existingUser.id, role: user.role });
        } else {
          await supabaseAdmin
            .from('user_roles')
            .update({ role: user.role })
            .eq('user_id', existingUser.id);
        }
        
        results.push({ username: user.username, status: 'updated', email });
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
          },
        });

        if (createError) {
          results.push({ username: user.username, status: 'error', error: createError.message });
          continue;
        }

        if (newUser.user) {
          // Update username in user_profiles
          await supabaseAdmin
            .from('user_profiles')
            .update({ username: user.username })
            .eq('user_id', newUser.user.id);

          // Add role
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role: user.role });

          results.push({ username: user.username, status: 'created', email });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
