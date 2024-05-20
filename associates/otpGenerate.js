// User Mobile otp using twilio

  function sendVerificationCode(phoneNumber) { // for sending
   return client.verify.v2.services(verifySid)
     .verifications.create({ to: `+91${phoneNumber}`, channel: "sms" });
 }
 function verifyOTP(phoneNumber, otpCode) { // For checking
   return client.verify.v2.services(verifySid)
     .verificationChecks.create({ to: `+91${phoneNumber}`, code: otpCode })
 }

 module.exports = {
   sendVerificationCode,
   verifyOTP,
 }