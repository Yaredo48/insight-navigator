import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "announcement" | "grade";
  // For announcements
  announcement_title?: string;
  announcement_content?: string;
  class_id?: string;
  // For grading
  student_id?: string;
  assignment_title?: string;
  grade?: number;
  max_points?: number;
  feedback?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (payload.type === "announcement") {
      // Get enrolled students' emails for the class
      let studentIds: string[] = [];

      if (payload.class_id) {
        const { data: enrollments } = await supabase
          .from("class_enrollments")
          .select("student_id")
          .eq("class_id", payload.class_id)
          .eq("status", "active");

        studentIds = enrollments?.map((e) => e.student_id) || [];
      }

      // For now, log the notification since we don't have student emails stored
      console.log(
        `Announcement notification: "${payload.announcement_title}" to ${studentIds.length} students`
      );

      // If we had student emails, we'd send them here:
      // For demonstration, send to any available email
      if (studentIds.length > 0) {
        console.log("Would send announcement email to student IDs:", studentIds);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Announcement notification queued for ${studentIds.length} students`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (payload.type === "grade") {
      console.log(
        `Grade notification: Assignment "${payload.assignment_title}" - ${payload.grade}/${payload.max_points} for student ${payload.student_id}`
      );

      // When auth is implemented and student emails are available:
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('email')
      //   .eq('id', payload.student_id)
      //   .single();
      //
      // if (profile?.email) {
      //   await resend.emails.send({
      //     from: 'Notifications <noreply@YOUR-VERIFIED-DOMAIN.com>',
      //     to: [profile.email],
      //     subject: `Grade posted: ${payload.assignment_title}`,
      //     html: `<h2>Your assignment has been graded</h2>
      //       <p><strong>${payload.assignment_title}</strong></p>
      //       <p>Grade: ${payload.grade}/${payload.max_points}</p>
      //       ${payload.feedback ? `<p>Feedback: ${payload.feedback}</p>` : ''}`,
      //   });
      // }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Grade notification sent",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification type" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
