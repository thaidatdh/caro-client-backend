let nodemailer = require("nodemailer");
exports.sendMail = async function (email, header, content) {
  const fromEmail = {
    email: "gmail-go-here@gmail.com",
    pwd: "password-go-here",
  };
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: fromEmail.email,
      pass: fromEmail.pwd,
    },
  });
  var mailOptions = {
    from: '"CaroTeam" <' + fromEmail.email + ">",
    to: email,
    subject: "[Caro] " + header,
    text: content,
  };

  return transporter.sendMail(mailOptions);
};
