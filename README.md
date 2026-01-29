# Insight Navigator

An AI-powered educational assistant for Ethiopian secondary schools (Grades 9-12), built with React, TypeScript, Supabase, and Lovable.

## Project Structure

```
insight-navigator/
├── src/
│   ├── components/     # React components
│   │   ├── chat/       # Chat-related components
│   │   ├── student/    # Student dashboard components
│   │   ├── teacher/    # Teacher dashboard components
│   │   └── ui/         # shadcn-ui components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── integrations/   # Supabase client configuration
│   └── types/          # TypeScript type definitions
├── supabase/
│   ├── functions/      # Edge Functions (serverless)
│   │   └── chat/       # Chat AI Edge Function
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- A Supabase account
- A Lovable API key (for AI features)

### Installation

```sh
npm install
```

### Local Development

```sh
npm run dev
```

This will start the Vite development server. For full functionality, you'll also need to run Supabase locally:

```sh
# Start Supabase local instance
supabase start

# Or use the combined command
npm run dev:full
```

### Environment Configuration

The project uses two `.env` files:

1. **`.env`** - Frontend environment variables (VITE_*)
2. **`supabase/.env`** - Supabase Edge Function environment variables

For local development, the default `.env` values work with the local Supabase instance.

## Supabase Setup

### Running Migrations

Database migrations are in `supabase/migrations/`. When Supabase is running locally, migrations are automatically applied.

For remote Supabase, run:
```sh
supabase migration up
```

### Deploying Edge Functions

The chat functionality uses a Supabase Edge Function that calls the Lovable AI Gateway.

**To deploy the Edge Function:**

1. Set up Supabase CLI and login:
   ```sh
   npm install -g supabase
   supabase login
   ```

2. Link to your remote Supabase project:
   ```sh
   supabase link --project-ref aoiasqbyctciwpfskapp
   ```

3. Deploy the chat function:
   ```sh
   supabase functions deploy chat
   ```

4. Set the Lovable API key as a secret:
   ```sh
   supabase secrets set LOVABLE_API_KEY=your_lovable_api_key_here
   ```

### Getting Your Lovable API Key

1. Visit [Lovable](https://lovable.dev) and sign in
2. Go to your project settings
3. Copy your API key
4. Set it using: `supabase secrets set LOVABLE_API_KEY=your_key`

### Switching to Remote Supabase

To use the deployed Edge Functions, update `.env`:

```env
# Comment out local values
# VITE_SUPABASE_URL="http://127.0.0.1:54321"
# VITE_SUPABASE_PUBLISHABLE_KEY="..."

# Use remote values
VITE_SUPABASE_URL="https://aoiasqbyctciwpfskapp.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWFzcWJ5Y3RjaXdwZnNrYXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAxMTAsImV4cCI6MjA4NTE2NjExMH0.Bi6WAK8Pa51lalgX6YU-7nMEn7mm_fgb2QaPQiGxUFc"
```

## Troubleshooting

### Error 503: Failed to get response

This error occurs when:
1. The Edge Function is not deployed
2. The `LOVABLE_API_KEY` is not set
3. The AI service is temporarily unavailable

**Solutions:**
- Ensure the Edge Function is deployed: `supabase functions deploy chat`
- Check the API key is set: `supabase secrets list`
- If using local Supabase, Edge Functions won't work - deploy to remote Supabase

### Error 401: Invalid API key

The Lovable API key is incorrect or missing. Get a new key from Lovable and set it:
```sh
supabase secrets set LOVABLE_API_KEY=your_new_key
```

### Rate limit exceeded (429)

Wait a moment and try again, or upgrade your Lovable plan for higher limits.

## Technologies Used

- **Frontend**: Vite, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **AI**: Lovable AI Gateway (google/gemini-3-flash)
- **Deployment**: Supabase Edge Functions

## License

MIT
