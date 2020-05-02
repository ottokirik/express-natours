const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor({ email, name }, url) {
    this.to = email;
    this.firstName = name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  transport() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    const { from, to, firstName, url } = this;

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName,
      url,
      subject
    });

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    await this.transport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natourse Family!');
  }

  async sendResetPassword() {
    await this.send(
      'passwordReset',
      'Your password reset token, valid only 10 minutes'
    );
  }
};
