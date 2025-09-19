// Base44 SDK disabled for local development
// Using Supabase instead of Base44 services

console.log('Base44 SDK disabled - using local Supabase implementation');

// Mock base44 client to prevent external calls
export const base44 = {
  entities: {
    Event: null,
    MediaItem: null,
    HighlightCategory: null,
    GuestWish: null,
    EventNotification: null
  },
  auth: {
    me: () => Promise.reject(new Error('Base44 auth disabled - use Supabase')),
    login: () => Promise.reject(new Error('Base44 auth disabled - use Supabase')),
    logout: () => Promise.reject(new Error('Base44 auth disabled - use Supabase'))
  },
  integrations: {
    Core: {
      UploadFile: () => Promise.reject(new Error('Base44 integrations disabled - use local implementation')),
      InvokeLLM: () => Promise.reject(new Error('Base44 integrations disabled')),
      SendEmail: () => Promise.reject(new Error('Base44 integrations disabled')),
      GenerateImage: () => Promise.reject(new Error('Base44 integrations disabled')),
      ExtractDataFromUploadedFile: () => Promise.reject(new Error('Base44 integrations disabled'))
    }
  }
};
