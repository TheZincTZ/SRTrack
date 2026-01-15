import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function getCommander() {
  try {
    const session = await requireAuth();
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('commanders')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching commander:', error);
      return null;
    }
    
    if (!data) {
      console.error('Commander not found for user:', session.user.id);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCommander:', error);
    return null;
  }
}

