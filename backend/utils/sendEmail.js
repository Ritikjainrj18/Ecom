const nodeMailer=require("nodemailer");
const sendEmail=async(options)=>{
    const transporter=nodeMailer.createTransport({
        service:process.env.service,
        auth:{
            user:process.env.email,
            pass:process.env.password
        }
    })
     
    const mailOptions={
        from:process.env.email,
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    
    await transporter.sendMail(mailOptions);
    //sus for sendMail vs sendEmail ?? => sendMail is builtin fun
}
module.exports=sendEmail;

