import { Injectable, Logger } from "@nestjs/common";

/**
 * Email service for sending various types of emails
 * This is a basic implementation that logs email content for development
 * In production, this should be configured with a real email service (e.g., SendGrid, AWS SES, Nodemailer with SMTP)
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Send a coach invitation email
   * @param to Email address of the recipient
   * @param token Invitation token
   * @param firstName Optional first name of the invited coach
   * @param lastName Optional last name of the invited coach
   */
  async sendCoachInvitation(
    to: string,
    token: string,
    firstName?: string,
    lastName?: string,
  ): Promise<void> {
    const invitationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-invitation/coach?token=${token}`;

    const greeting =
      firstName && lastName
        ? `Hello ${firstName} ${lastName}`
        : firstName
          ? `Hello ${firstName}`
          : "Hello";

    const emailContent = {
      to,
      subject:
        "You're Invited to Join the Multi-Sport Athlete Injury Surveillance System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${greeting},</h2>
          <p>You have been invited to join the Multi-Sport Athlete Injury Surveillance System as a coach.</p>
          <p>Click the button below to accept your invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${invitationLink}" style="color: #2563eb;">${invitationLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
${greeting},

You have been invited to join the Multi-Sport Athlete Injury Surveillance System as a coach.

Accept your invitation by visiting this link:
${invitationLink}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.
      `,
    };

    // For development: Log the email content
    this.logger.log("======= COACH INVITATION EMAIL =======");
    this.logger.log(`To: ${emailContent.to}`);
    this.logger.log(`Subject: ${emailContent.subject}`);
    this.logger.log(`Link: ${invitationLink}`);
    this.logger.log(`Token: ${token}`);
    this.logger.log("=====================================");

    // TODO: In production, implement actual email sending here
    // Example with nodemailer:
    // await this.transporter.sendMail(emailContent);

    // For now, we just log for development purposes
    return Promise.resolve();
  }

  /**
   * Send a parent invitation email
   * @param to Email address of the recipient
   * @param token Invitation token
   * @param coachName Name of the coach who sent the invitation
   */
  async sendParentInvitation(
    to: string,
    token: string,
    coachName?: string,
  ): Promise<void> {
    const invitationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-invitation/parent?token=${token}`;

    const invitedBy = coachName
      ? `You have been invited by ${coachName} to`
      : "You have been invited to";

    const emailContent = {
      to,
      subject:
        "You're Invited to Join the Multi-Sport Athlete Injury Surveillance System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hello,</h2>
          <p>${invitedBy} join the Multi-Sport Athlete Injury Surveillance System as a parent.</p>
          <p>This system helps track and manage athlete injuries and health information.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${invitationLink}" style="color: #2563eb;">${invitationLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
Hello,

${invitedBy} join the Multi-Sport Athlete Injury Surveillance System as a parent.

Accept your invitation by visiting this link:
${invitationLink}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.
      `,
    };

    // For development: Log the email content
    this.logger.log("======= PARENT INVITATION EMAIL =======");
    this.logger.log(`To: ${emailContent.to}`);
    this.logger.log(`Subject: ${emailContent.subject}`);
    this.logger.log(`Link: ${invitationLink}`);
    this.logger.log(`Token: ${token}`);
    this.logger.log("======================================");

    // TODO: In production, implement actual email sending
    return Promise.resolve();
  }
}
