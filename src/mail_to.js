const nodemailer = require('nodemailer');
const dotenv = process.env;
/** ********************************************************************************************************************************************************
 * メール送信
 * @param {Object} params
 * @param {String|Array} params.to - メールアドレス
 * @param {String} params.subject     - 件名
 * @param {String} params.text        - 内容(PlainText)
 * @param {String} params.html        - 内容(HTML)
 ******************************************************************************************************************************************************** */
exports.send = async function (params) {
  const to = Array.isArray(params.to) ? params.to.join(', ') : params.to;
  let transporter = nodemailer.createTransport({
    host: dotenv.EMAIL_HOSTNAME,
    port: 465,
    secure: true, // 465:true, other: false
    auth: {
      user: dotenv.EMAIL_USERNAME,
      pass: dotenv.EMAIL_PASSWORD,
    },
  });

  try {
    let info = await transporter.sendMail({
      from   : dotenv.EMAIL_FROM, // sender address
      to     : to, // list of receivers
      subject: params.subject,    // Subject line
      text   : params.text || null,  // plain text body
      html   : params.html || null,  // html body
    });

    return {
      status: 'success',
      sent  : info.messageId,
      url   : nodemailer.getTestMessageUrl(info),
    };
  } catch (e) {
    throw e;
  }
}