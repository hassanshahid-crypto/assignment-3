import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

function getTransporter() {
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;
	if (!user || !pass) return null;

	return nodemailer.createTransport({
		service: 'gmail',
		auth: { user, pass }
	});
}

function resetEmailHtml(name: string, resetUrl: string) {
	return `
		<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px; border-radius: 12px;">
					<span style="color: white; font-size: 20px; font-weight: bold;">AuthApp</span>
				</div>
			</div>
			<div style="background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
				<h2 style="color: #111827; margin: 0 0 8px 0; font-size: 22px;">Reset your password</h2>
				<p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
					Hi ${name || 'there'}, we received a request to reset your password. Click the button below to choose a new one.
				</p>
				<div style="text-align: center; margin: 32px 0;">
					<a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px;">
						Reset Password
					</a>
				</div>
				<p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0 0; line-height: 1.5;">
					This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
				</p>
			</div>
			<p style="color: #d1d5db; font-size: 12px; text-align: center; margin-top: 24px;">
				&copy; ${new Date().getFullYear()} AuthApp
			</p>
		</div>`;
}

function verifyEmailHtml(name: string, verifyUrl: string) {
	return `
		<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 32px;">
				<div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px; border-radius: 12px;">
					<span style="color: white; font-size: 20px; font-weight: bold;">AuthApp</span>
				</div>
			</div>
			<div style="background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
				<h2 style="color: #111827; margin: 0 0 8px 0; font-size: 22px;">Verify your email</h2>
				<p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
					Hi ${name || 'there'}, thanks for signing up! Please verify your email address to activate your account.
				</p>
				<div style="text-align: center; margin: 32px 0;">
					<a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px;">
						Verify Email
					</a>
				</div>
				<p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0 0; line-height: 1.5;">
					This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
				</p>
			</div>
			<p style="color: #d1d5db; font-size: 12px; text-align: center; margin-top: 24px;">
				&copy; ${new Date().getFullYear()} AuthApp
			</p>
		</div>`;
}

function logToConsole(type: string, to: string, url: string) {
	console.log(`\n${'='.repeat(50)}`);
	console.log(`  ${type}`);
	console.log('='.repeat(50));
	console.log(`  To: ${to}`);
	console.log(`  Link: ${url}`);
	console.log('='.repeat(50) + '\n');
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<{ delivered: boolean }> {
	logToConsole('PASSWORD RESET EMAIL', to, resetUrl);

	const transporter = getTransporter();
	if (transporter) {
		try {
			await transporter.sendMail({
				from: `AuthApp <${env.SMTP_USER}>`,
				to,
				subject: 'Reset Your Password - AuthApp',
				html: resetEmailHtml(name, resetUrl)
			});
			console.log(`  [SMTP] Email delivered to ${to}\n`);
			return { delivered: true };
		} catch (err) {
			console.log(`  [SMTP] Failed to send to ${to}: ${err}`);
			return { delivered: false };
		}
	}
	return { delivered: false };
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<{ delivered: boolean }> {
	logToConsole('EMAIL VERIFICATION', to, verifyUrl);

	const transporter = getTransporter();
	if (transporter) {
		try {
			await transporter.sendMail({
				from: `AuthApp <${env.SMTP_USER}>`,
				to,
				subject: 'Verify Your Email - AuthApp',
				html: verifyEmailHtml(name, verifyUrl)
			});
			console.log(`  [SMTP] Email delivered to ${to}\n`);
			return { delivered: true };
		} catch (err) {
			console.log(`  [SMTP] Failed to send to ${to}: ${err}`);
			return { delivered: false };
		}
	}
	return { delivered: false };
}
