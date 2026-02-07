import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildGradeEmailHtml(payload: NotificationRequest): string {
  const percentage = payload.max_points
    ? Math.round(((payload.grade || 0) / payload.max_points) * 100)
    : 0;
  const scoreColor = percentage >= 80 ? "#16a34a" : percentage >= 60 ? "#ca8a04" : "#dc2626";

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #1e293b; font-size: 20px; margin: 0 0 8px;">📝 Assignment Graded</h1>
        <p style="color: #64748b; margin: 0 0 24px; font-size: 14px;">Your assignment has been reviewed and graded.</p>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 13px;">${payload.assignment_title}</p>
          <p style="margin: 0; color: ${scoreColor}; font-size: 36px; font-weight: bold;">${payload.grade}/${payload.max_points}</p>
          <p style="margin: 4px 0 0; color: ${scoreColor}; font-size: 16px; font-weight: 600;">${percentage}%</p>
        </div>
        
        ${payload.feedback ? `
        <div style="border-left: 3px solid #6366f1; padding: 12px 16px; background: #f5f3ff; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #6366f1; font-weight: 600;">TEACHER FEEDBACK</p>
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">${payload.feedback}</p>
        </div>` : ""}
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">Ethiopian Education Platform • Grade Notification</p>
      </div>
    </body>
    </html>
  `;
}

function buildAnnouncementEmailHtml(payload: NotificationRequest, className?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #1e293b; font-size: 20px; margin: 0 0 8px;">📢 New Announcement</h1>
        ${className ? `<p style="color: #6366f1; font-size: 13px; margin: 0 0 16px; font-weight: 600;">${className}</p>` : ""}
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 12px; color: #1e293b; font-size: 18px;">${payload.announcement_title}</h2>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${payload.announcement_content}</p>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">Ethiopian Education Platform • Announcement</p>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing ${payload.type} notification`);

    if (payload.type === "announcement") {
      // Get enrolled students for the class
      let studentIds: string[] = [];
      let className: string | undefined;

      if (payload.class_id) {
        const { data: enrollments } = await supabase
          .from("class_enrollments")
          .select("student_id")
          .eq("class_id", payload.class_id)
          .eq("status", "active");

        studentIds = enrollments?.map((e: any) => e.student_id) || [];

        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .eq("id", payload.class_id)
          .single();

        className = classData?.name;
      }

      // Lookup emails from profiles
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email, display_name")
          .in("user_id", studentIds)
          .not("email", "is", null);

        const emails = profiles?.map((p: any) => p.email).filter(Boolean) || [];

        if (emails.length > 0) {
          const html = buildAnnouncementEmailHtml(payload, className);

          const { error: emailError } = await resend.emails.send({
            from: "EduPlatform <onboarding@resend.dev>",
            to: emails,
            subject: `📢 ${payload.announcement_title}`,
            html,
          });

          if (emailError) {
            console.error("Resend error:", emailError);
          } else {
            console.log(`Announcement email sent to ${emails.length} recipients`);
          }
        } else {
          console.log(`No emails found for ${studentIds.length} enrolled students`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Announcement notification processed for ${studentIds.length} students`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (payload.type === "grade") {
      console.log(
        `Grade notification: "${payload.assignment_title}" - ${payload.grade}/${payload.max_points} for student ${payload.student_id}`
      );

      // Lookup student email from profiles
      if (payload.student_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", payload.student_id)
          .single();

        if (profile?.email) {
          const html = buildGradeEmailHtml(payload);

          const { error: emailError } = await resend.emails.send({
            from: "EduPlatform <onboarding@resend.dev>",
            to: [profile.email],
            subject: `📝 Grade posted: ${payload.assignment_title} - ${payload.grade}/${payload.max_points}`,
            html,
          });

          if (emailError) {
            console.error("Resend error:", emailError);
          } else {
            console.log(`Grade email sent to ${profile.email}`);
          }
        } else {
          console.log(`No email found for student ${payload.student_id}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Grade notification processed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification type" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
