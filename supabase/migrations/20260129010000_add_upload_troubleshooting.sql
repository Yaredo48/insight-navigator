-- Add Document Upload Issues troubleshooting flow
INSERT INTO public.troubleshooting_flows (title, description, category, steps) VALUES
(
  'Document Upload Issues',
  'Troubleshoot problems with uploading files to the chat',
  'upload',
  '{
    "steps": [
      {
        "id": "step-1",
        "question": "Are you trying to upload a file larger than 10MB?",
        "type": "yes_no",
        "branches": {
          "yes": "step-size-limit",
          "no": "step-2"
        }
      },
      {
        "id": "step-size-limit",
        "message": "The maximum file size allowed is 10MB. Please try compressing your file or splitting it into smaller parts.",
        "type": "error",
        "tip": "Tools like Adobe Acrobat or online compressors can help reduce PDF file size."
      },
      {
        "id": "step-2",
        "question": "Is the file format PDF, TXT, or MD?",
        "type": "yes_no",
        "branches": {
          "yes": "step-3",
          "no": "step-format-issue"
        }
      },
      {
        "id": "step-format-issue",
        "message": "Currently, we only support PDF, TXT, and Markdown (MD) files. Please convert your file to one of these formats.",
        "type": "error",
        "tip": "You can usually \"Save As\" or \"Export\" to PDF from most document editors."
      },
      {
        "id": "step-3",
        "question": "Are you seeing a \"Network Error\" message?",
        "type": "yes_no",
        "branches": {
          "yes": "step-network",
          "no": "step-4"
        }
      },
      {
        "id": "step-network",
        "message": "This might be a temporary connection issue. Please check your internet connection and try again in a moment.",
        "type": "instruction",
        "next": "step-retry"
      },
      {
        "id": "step-retry",
        "question": "Did it work after waiting?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-browser"
        }
      },
      {
        "id": "step-browser",
        "message": "Try refreshing the page or clearing your browser cache. Sometimes browser extensions can also interfere with uploads.",
        "type": "instruction",
        "next": "step-final-check"
      },
      {
        "id": "step-final-check",
        "question": "Were you able to upload the file?",
        "type": "yes_no",
        "branches": {
          "yes": "step-success",
          "no": "step-contact-support"
        }
      },
      {
        "id": "step-4",
        "question": "Does the file open correctly on your computer?",
        "type": "yes_no",
        "branches": {
          "yes": "step-unknown",
          "no": "step-corrupt"
        }
      },
      {
        "id": "step-corrupt",
        "message": "The file appears to be corrupted. Please try creating a fresh copy of the document and uploading that.",
        "type": "error"
      },
      {
        "id": "step-unknown",
        "message": "We''re not sure what''s wrong. Please try a different file to see if it''s a system-wide issue.",
        "type": "instruction",
        "next": "step-final-check"
      },
      {
        "id": "step-contact-support",
        "message": "It looks like a persistent issue. Please contact support with the specific error message you''re seeing.",
        "type": "error"
      },
      {
        "id": "step-success",
        "message": "Glad we could get that sorted! Your file is now uploaded and ready to analyze. 📄",
        "type": "success",
        "tip": "Pro tip: You can upload multiple files at once by selecting them together!"
      }
    ]
  }'::jsonb
);
