-- Create troubleshooting_sessions table to track active sessions
CREATE TABLE public.troubleshooting_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    flow_id TEXT,
    current_step_index INTEGER NOT NULL DEFAULT 0,
    step_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create user_progress table for gamification (badges, tips, stats)
CREATE TABLE public.user_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    flows_completed INTEGER NOT NULL DEFAULT 0,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    tips_unlocked JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create troubleshooting_templates table for predefined flows
CREATE TABLE public.troubleshooting_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    steps JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.troubleshooting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.troubleshooting_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for troubleshooting_sessions (public access for demo)
CREATE POLICY "Anyone can view troubleshooting sessions"
    ON public.troubleshooting_sessions FOR SELECT USING (true);

CREATE POLICY "Anyone can create troubleshooting sessions"
    ON public.troubleshooting_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update troubleshooting sessions"
    ON public.troubleshooting_sessions FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete troubleshooting sessions"
    ON public.troubleshooting_sessions FOR DELETE USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Anyone can view user progress"
    ON public.user_progress FOR SELECT USING (true);

CREATE POLICY "Anyone can create user progress"
    ON public.user_progress FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user progress"
    ON public.user_progress FOR UPDATE USING (true);

-- RLS Policies for troubleshooting_templates (read-only for users)
CREATE POLICY "Anyone can view troubleshooting templates"
    ON public.troubleshooting_templates FOR SELECT USING (true);

CREATE POLICY "Anyone can create troubleshooting templates"
    ON public.troubleshooting_templates FOR INSERT WITH CHECK (true);

-- Add trigger for updated_at on templates
CREATE TRIGGER update_troubleshooting_templates_updated_at
    BEFORE UPDATE ON public.troubleshooting_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with initial troubleshooting templates
INSERT INTO public.troubleshooting_templates (title, description, category, steps) VALUES
(
    'Device Won''t Turn On',
    'Step-by-step guide to diagnose and fix power issues',
    'power',
    '[
        {"id": "check_power", "question": "Is the power cable properly connected to both the device and the outlet?", "type": "yes_no", "branches": {"yes": "check_outlet", "no": "connect_power"}},
        {"id": "connect_power", "message": "Please connect the power cable securely to both the device and a working outlet.", "type": "instruction", "next": "power_connected"},
        {"id": "power_connected", "question": "Is the power cable now connected?", "type": "yes_no", "branches": {"yes": "check_outlet", "no": "contact_support"}},
        {"id": "check_outlet", "question": "Have you tried a different power outlet?", "type": "yes_no", "branches": {"yes": "press_power", "no": "try_outlet"}},
        {"id": "try_outlet", "message": "Try plugging the device into a different power outlet to rule out outlet issues.", "type": "instruction", "next": "outlet_changed"},
        {"id": "outlet_changed", "question": "Did changing the outlet help?", "type": "yes_no", "branches": {"yes": "press_power", "no": "check_cable"}},
        {"id": "check_cable", "question": "Do you have another power cable to try?", "type": "yes_no", "branches": {"yes": "try_cable", "no": "press_power"}},
        {"id": "try_cable", "message": "Try using the alternate power cable.", "type": "instruction", "next": "cable_changed"},
        {"id": "cable_changed", "question": "Did the new cable solve the issue?", "type": "yes_no", "branches": {"yes": "success", "no": "press_power"}},
        {"id": "press_power", "question": "Press and hold the power button for 10 seconds. Do you see any lights or hear any sounds?", "type": "yes_no", "branches": {"yes": "success", "no": "contact_support"}, "tip": "Some devices have a reset button - check your manual!"},
        {"id": "success", "message": "Your device is now powered on! Here''s a pro tip: Always use a surge protector to prevent power issues.", "type": "success"},
        {"id": "contact_support", "message": "We''ve tried the basic steps. This might be a hardware issue. Please contact our support team for further assistance.", "type": "error"}
    ]'::jsonb
),
(
    'Internet Connection Issues',
    'Troubleshoot network connectivity problems',
    'connectivity',
    '[
        {"id": "check_wifi", "question": "Is your device connected to WiFi?", "type": "yes_no", "branches": {"yes": "check_other_devices", "no": "connect_wifi"}},
        {"id": "connect_wifi", "message": "Go to Settings > WiFi and connect to your network.", "type": "instruction", "next": "wifi_connected"},
        {"id": "wifi_connected", "question": "Were you able to connect to WiFi?", "type": "yes_no", "branches": {"yes": "check_other_devices", "no": "check_password"}},
        {"id": "check_password", "question": "Are you sure the WiFi password is correct?", "type": "yes_no", "branches": {"yes": "restart_router", "no": "get_password"}},
        {"id": "get_password", "message": "Check your router for the correct password (usually on a sticker) or contact your network admin.", "type": "instruction", "next": "connect_wifi"},
        {"id": "check_other_devices", "question": "Can other devices connect to the internet on this network?", "type": "yes_no", "branches": {"yes": "restart_device", "no": "restart_router"}},
        {"id": "restart_router", "message": "Unplug your router, wait 30 seconds, and plug it back in. Wait 2 minutes for it to fully restart.", "type": "instruction", "next": "router_restarted", "tip": "Restarting your router fixes 80% of connection issues!"},
        {"id": "router_restarted", "question": "Is the internet working now?", "type": "yes_no", "branches": {"yes": "success", "no": "check_isp"}},
        {"id": "restart_device", "message": "Restart your device and try connecting again.", "type": "instruction", "next": "device_restarted"},
        {"id": "device_restarted", "question": "Is the connection working after restart?", "type": "yes_no", "branches": {"yes": "success", "no": "forget_network"}},
        {"id": "forget_network", "message": "Go to WiFi settings, forget the network, and reconnect.", "type": "instruction", "next": "network_forgotten"},
        {"id": "network_forgotten", "question": "Did reconnecting fix the issue?", "type": "yes_no", "branches": {"yes": "success", "no": "check_isp"}},
        {"id": "check_isp", "message": "The issue might be with your Internet Service Provider. Check their status page or contact them.", "type": "error"},
        {"id": "success", "message": "You''re back online! Pro tip: Keep your router firmware updated for best performance.", "type": "success"}
    ]'::jsonb
),
(
    'App Not Loading',
    'Fix application startup and loading issues',
    'software',
    '[
        {"id": "check_loading", "question": "Does the app show a loading spinner or is it completely blank?", "type": "yes_no", "branches": {"yes": "wait_longer", "no": "clear_cache"}},
        {"id": "wait_longer", "message": "Sometimes apps take a moment to load. Wait 30 seconds.", "type": "instruction", "next": "still_loading"},
        {"id": "still_loading", "question": "Is the app still stuck loading?", "type": "yes_no", "branches": {"yes": "clear_cache", "no": "success"}},
        {"id": "clear_cache", "message": "Clear your browser cache: Settings > Privacy > Clear Browsing Data", "type": "instruction", "next": "cache_cleared", "tip": "Clearing cache regularly improves app performance!"},
        {"id": "cache_cleared", "question": "Did clearing the cache fix the loading issue?", "type": "yes_no", "branches": {"yes": "success", "no": "try_incognito"}},
        {"id": "try_incognito", "message": "Try opening the app in an incognito/private browsing window.", "type": "instruction", "next": "incognito_result"},
        {"id": "incognito_result", "question": "Does the app work in incognito mode?", "type": "yes_no", "branches": {"yes": "disable_extensions", "no": "check_internet"}},
        {"id": "disable_extensions", "message": "A browser extension might be causing issues. Try disabling extensions and reload.", "type": "instruction", "next": "extensions_disabled"},
        {"id": "extensions_disabled", "question": "Did disabling extensions fix it?", "type": "yes_no", "branches": {"yes": "success", "no": "contact_support"}},
        {"id": "check_internet", "question": "Is your internet connection working? Can you access other websites?", "type": "yes_no", "branches": {"yes": "contact_support", "no": "fix_internet"}},
        {"id": "fix_internet", "message": "Please fix your internet connection first, then try the app again.", "type": "error"},
        {"id": "contact_support", "message": "This might be a server issue. Please try again later or contact support.", "type": "error"},
        {"id": "success", "message": "The app is now loading correctly! Pro tip: Keep your browser updated for best compatibility.", "type": "success"}
    ]'::jsonb
);