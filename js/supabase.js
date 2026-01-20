import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Your Supabase credentials
const supabaseUrl = 'https://pdimzvhvlpfqnwyhjely.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaW16dmh2bHBmcW53eWhqZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkyOTYsImV4cCI6MjA4NDM0NTI5Nn0.JhOfiInkof_mrUIACxDL1UhroQfbjqvciIl3V5r9Uso';

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection function
export async function testConnection() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log('✅ Connected to Supabase successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error.message);
        return false;
    }
}

// Helper function to format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

// Helper function to format date
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}