let nodemailer = require("nodemailer");
exports.sendMail = async function (email, header, content) {
  const fromEmail = {
    email: "ptudw1733@gmail.com",
    pwd1: "PTUDW",
    pwd2: "1733@",
  };
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: fromEmail.email,
      pass: fromEmail.pwd1 + fromEmail.pwd2,
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
