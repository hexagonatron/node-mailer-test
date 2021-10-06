const router = require('express').Router();
const { User } = require('../../models');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

router.get('/verifyemail/:randomstring', async (req, res) => {
  const user = await User.findOne({where:{verify_string: req.params.randomstring} })
  if (!user) {
    return res.send('No User Found');
  }

  user.verified = true
  user.save();
  res.send('You are verified!');
})

router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const randomString = uuidv4();
    const userObject = {
      name,
      email,
      password,
      verify_string: randomString
    }
    const userData = await User.create(userObject);

    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      tls: {
        ciphers: 'SSLv3'
      },
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    })
    const message = `Please verify your account by clicking this link: http://localhost:3001/api/users/verifyemail/${randomString}`;


    const mailOptions = {
      from: '"Node Application" <smoke-blast-mule-accept@outlook.com>', // sender address (who sends)
      to: email, // list of receivers (who receives)
      subject: 'Verify your account', // Subject line
      text: message,
      html: message
    };

    transporter.sendMail(mailOptions, (error, data) => {
      if (error) {
        console.log(error);
      }
      console.log(data.messageId);
    });
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;

      res.status(200).json({ message: 'user created!', userId: userData.id });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post('/login', async (req, res) => {
  try {
    const userData = await User.findOne({ where: { email: req.body.email } });

    if (!userData) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;

      res.json({ user: userData, message: 'You are now logged in!' });
    });

  } catch (err) {
    res.status(400).json(err);
  }
});

router.post('/logout', (req, res) => {
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

router.post('/email', (req, res) => {


})

module.exports = router;
