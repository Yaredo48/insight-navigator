-- Enable realtime for messages table to support live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add UPDATE policy for messages to allow editing
CREATE POLICY "Anyone can update messages"
ON public.messages
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add DELETE policy for messages to allow deletion
CREATE POLICY "Anyone can delete messages"
ON public.messages
FOR DELETE
USING (true);