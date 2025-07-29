import nodemailer from 'nodemailer';
import { env } from '~/env';
export const createTransporter = () => {
	return nodemailer.createTransport({
		pool: true,
		host: env.email_host,
		port: env.email_port,
		secure: true, // use TLS
		auth: {
			user: env.email_user,
			pass: env.email_password
		}
	});
};
export const emailTransporter = createTransporter();
export const emaildefaultConfig: Parameters<ReturnType<typeof createTransporter>['sendMail']>[number]= {
	from: env.email_user, 
	subject: '珠海环界云计算有限公司 - 发票', // 邮件主题
	text: `尊敬的客户，您好
			您的购货发票已添加至附件，请下载查收！`, // 邮件正文
}