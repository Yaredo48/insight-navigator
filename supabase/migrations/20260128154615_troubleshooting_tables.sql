-- Create troubleshooting flow templates table
CREATE TABLE public.troubleshooting_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., "device", "connection", "software"
  steps JSONB NOT NULL, -- Array of step objects with branching logic
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active troubleshooting sessions table
CREATE TABLE public.troubleshooting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES public.troubleshooting_flows(id) ON DELETE SET NULL,
  current_step_index INTEGER DEFAULT 0,
  step_history JSONB DEFAULT '[]'::jsonb, -- Track user's path through the flow
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb -- Store session-specific data
);

-- Create user progress and achievements table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Using TEXT for anonymous users, can be UUID for authenticated
  flows_completed INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  tips_unlocked JSONB DEFAULT '[]'::jsonb,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.troubleshooting_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.troubleshooting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for demo)
CREATE POLICY "Anyone can view flows" ON public.troubleshooting_flows FOR SELECT USING (true);
CREATE POLICY "Anyone can create flows" ON public.troubleshooting_flows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update flows" ON public.troubleshooting_flows FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete flows" ON public.troubleshooting_flows FOR DELETE USING (true);

CREATE POLICY "Anyone can view sessions" ON public.troubleshooting_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON public.troubleshooting_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.troubleshooting_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.troubleshooting_sessions FOR DELETE USING (true);

CREATE POLICY "Anyone can view progress" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can create progress" ON public.user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update progress" ON public.user_progress FOR UPDATE USING (true);

-- Create trigger for automatic timestamp updates on flows
CREATE TRIGGER update_troubleshooting_flows_updated_at
BEFORE UPDATE ON public.troubleshooting_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance optimization
CREATE INDEX idx_sessions_conversation ON public.troubleshooting_sessions(conversation_id);
CREATE INDEX idx_sessions_status ON public.troubleshooting_sessions(status);
CREATE INDEX idx_sessions_started_at ON public.troubleshooting_sessions(started_at DESC);
CREATE INDEX idx_flows_category ON public.troubleshooting_flows(category);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);

-- Insert some predefined troubleshooting flows
INSERT INTO public.troubleshooting_flows (title, description, category, steps) VALUES
(
  'Device Not Turning On',
  'Step-by-step guide to troubleshoot a device that won''t power on',
  'device',
  '{
    "steps": [
      {
        "id": "step-1",
        "question": "Have you plugged in the device?",
        "type": "yes_no",
        "branches": {
          "yes": "step-2",
          "no": "step-1-help"
        }
      },
      {
        "id": "step-1-help",
        "message": "Please plug in the device and try again. Make sure the power cable is securely connected to both the device and the power outlet.",
        "type": "instruction",
        "next": "step-2"
      },
      {
        "id": "step-2",
        "question": "Do you see any LED lights or indicators on the device?",
        "type": "yes_no",
        "branches": {
          "yes": "step-3",
          "no": "step-2-help"
        }
      },
      {
        "id": "step-2-help",
        "message": "Try pressing and holding the power button for 3-5 seconds. Some devices require a longer press to turn on.",
        "type": "instruction",
        "next": "step-3-check"
      },
      {
        "id": "step-3-check",
        "question": "Do you see any lights now?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-power-check"
        }
      },
      {
        "id": "step-3",
        "question": "Is the LED blinking or solid?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-power-check"
        }
      },
      {
        "id": "step-power-check",
        "message": "Let''s check the power source. Try plugging the device into a different power outlet.",
        "type": "instruction",
        "next": "step-outlet-check"
      },
      {
        "id": "step-outlet-check",
        "question": "Does the device turn on with a different outlet?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-cable-check"
        }
      },
      {
        "id": "step-cable-check",
        "message": "The power cable might be faulty. If you have a spare cable, try using it. Otherwise, the device may need professional repair.",
        "type": "instruction",
        "next": "step-final"
      },
      {
        "id": "step-final",
        "question": "Did replacing the cable solve the issue?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-failure"
        }
      },
      {
        "id": "step-success",
        "message": "Great! Your device is now powered on. 🎉",
        "type": "success",
        "tip": "Pro tip: Always check the power cable and outlet first to save time troubleshooting!"
      },
      {
        "id": "step-failure",
        "message": "It seems the issue requires professional attention. Please contact the manufacturer or a certified repair service.",
        "type": "error",
        "tip": "Keep your device''s warranty information handy for faster service."
      }
    ]
  }'::jsonb
),
(
  'Internet Connection Issues',
  'Troubleshoot common internet connectivity problems',
  'connection',
  '{
    "steps": [
      {
        "id": "step-1",
        "question": "Is your Wi-Fi router powered on?",
        "type": "yes_no",
        "branches": {
          "yes": "step-2",
          "no": "step-1-help"
        }
      },
      {
        "id": "step-1-help",
        "message": "Please turn on your Wi-Fi router and wait 30 seconds for it to fully boot up.",
        "type": "instruction",
        "next": "step-2"
      },
      {
        "id": "step-2",
        "question": "Can you see your Wi-Fi network in the available networks list?",
        "type": "yes_no",
        "branches": {
          "yes": "step-3",
          "no": "step-2-help"
        }
      },
      {
        "id": "step-2-help",
        "message": "Try restarting your router by unplugging it for 10 seconds, then plugging it back in.",
        "type": "instruction",
        "next": "step-2-check"
      },
      {
        "id": "step-2-check",
        "question": "Can you see your network now?",
        "type": "yes_no",
        "branches": {
          "yes": "step-3",
          "no": "step-router-issue"
        }
      },
      {
        "id": "step-3",
        "question": "Are you able to connect to the Wi-Fi network?",
        "type": "yes_no",
        "branches": {
          "yes": "step-4",
          "no": "step-3-help"
        }
      },
      {
        "id": "step-3-help",
        "message": "Make sure you''re entering the correct Wi-Fi password. Passwords are case-sensitive.",
        "type": "instruction",
        "next": "step-3-check"
      },
      {
        "id": "step-3-check",
        "question": "Were you able to connect?",
        "type": "yes_no",
        "branches": {
          "yes": "step-4",
          "no": "step-forget-network"
        }
      },
      {
        "id": "step-forget-network",
        "message": "Try ''forgetting'' the network on your device and reconnecting from scratch.",
        "type": "instruction",
        "next": "step-reconnect"
      },
      {
        "id": "step-reconnect",
        "question": "Did that work?",
        "type": "yes_no",
        "branches": {
          "yes": "step-4",
          "no": "step-router-issue"
        }
      },
      {
        "id": "step-4",
        "question": "Can you browse the internet now?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-dns"
        }
      },
      {
        "id": "step-dns",
        "message": "You''re connected but can''t browse. Try changing your DNS to 8.8.8.8 (Google DNS) in your network settings.",
        "type": "instruction",
        "next": "step-dns-check"
      },
      {
        "id": "step-dns-check",
        "question": "Can you browse now?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-isp-issue"
        }
      },
      {
        "id": "step-router-issue",
        "message": "Your router may have a hardware issue. Try resetting it to factory settings or contact your ISP.",
        "type": "error",
        "tip": "Keep your ISP''s support number saved for quick access."
      },
      {
        "id": "step-isp-issue",
        "message": "The issue might be with your Internet Service Provider. Contact them to check for outages in your area.",
        "type": "error",
        "tip": "Many ISPs have status pages where you can check for known outages."
      },
      {
        "id": "step-success",
        "message": "Excellent! Your internet connection is working. 🌐",
        "type": "success",
        "tip": "Pro tip: Restart your router monthly to keep it running smoothly!"
      }
    ]
  }'::jsonb
);
