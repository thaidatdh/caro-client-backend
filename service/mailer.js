let nodemailer = require("nodemailer");
const fromEmail = {
  email: "temp@gmail.com",
  pwd: "temp",
}
exports.sendMail = function(email, header, content) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: fromEmail.email,
      pass: fromEmail.pwd
    },
  });
  var mailOptions = {
    from: fromEmail.email,
    to: email,
    subject: "[Caro] " + header,
    text: content,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}