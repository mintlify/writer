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