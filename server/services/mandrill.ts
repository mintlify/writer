// https://www.notion.so/mintlify/Mandrill-a3257114b14b450ca53fb39c145d21b6#bf9b1ab153e04982a6f4ca0227ccb81d
import axios from 'axios';

const TEMPLATE_SLUG = 'ai-doc-writer-invite-to-team';

export const sendInviteEmail = async (toEmail: string, fromEmail = 'hi@mintlify.com') => {
  await axios.post('https://mandrillapp.com/api/1.0/messages/send-template', {
    key: process.env.MAILCHIMP_TRANSACTIONAL_KEY,
    template_name: TEMPLATE_SLUG,
    template_content: [],
    message: {
      to: [
        {
          email: toEmail,
        }
      ],
      from_email: 'hi@mintlify.com',
      from_name: fromEmail,
      merge_language: 'handlebars',
      global_merge_vars: [
        {
          name: 'fromEmail',
          content: fromEmail
        }
      ]
    }
  });
}