const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/students', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("MongoDB connection successful");

    // Ensure admin data is added to the database
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
        // Hash the admin's password
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(adminPassword, salt, async (err, hash) => {
                if (err) throw err;
                const adminData = {
                    email: adminEmail,
                    password: hash
                };

                // Save admin data to MongoDB
                const adminUser = new Admin(adminData);
                try {
                    await adminUser.save();
                    console.log('Admin user created successfully');
                } catch (err) {
                    console.error('Error creating admin user:', err);
                }
            });
        });
    }
  // Ensure library data is added to the database
  const libraryEmail = 'library@gmail.com';
  const libraryPassword = 'library';

  // Check if library already exists
  const existingLibrary = await Library.findOne({ email: libraryEmail });
  if (!existingLibrary) {
      // Hash the library's password
      bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(libraryPassword, salt, async (err, hash) => {
              if (err) throw err;
              const libraryData = {
                  email: libraryEmail,
                  password: hash
              };

              // Save library data to MongoDB
              const libraryUser = new Library(libraryData);
              try {
                  await libraryUser.save();
                  console.log('Library user created successfully');
              } catch (err) {
                  console.error('Error creating library user:', err);
              }
          });
      });
  }



}).catch((err) => {
    console.error("MongoDB connection error:", err);
});



// Define User schema and model with password hashing
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const User = mongoose.model('User', userSchema);

// Define Admin schema and model
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Admin = mongoose.model('Admin', adminSchema);

// Define QR code schema and model
const qrSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    branch: { type: String, required: true },
    course: { type: String, required: true },
    usn: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    batch: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    address: { type: String, required: true },
    imageUrl: { type: String, required: true },
    qrCodeImage: { type: String, required: true }
});

const QR = mongoose.model('QR', qrSchema);

// Define Library schema and model
const librarySchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Library = mongoose.model('Library', librarySchema);
// Serve the registration form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Register.html'));
});

// Serve the login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the library login form
app.get('/librarylogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'librarylogin.html'));
});
// Serve the admin login form
app.get('/adminlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'adminlogin.html'));
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    console.log("Received registration data:", req.body);

    // Check if email exists in the QR schema
    const qrRecord = await QR.findOne({ email });
    if (!qrRecord) {
        return res.status(400).send("Email not authorized for registration");
    }

    const user = new User({ fullname, email, password });

    try {
        await user.save();
        console.log("User saved:", user);
        res.send("Registration successful");
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).send("An error occurred during registration");
    }
});

// Handle student login form submission
app.post('/student', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("User not found");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }

        // Redirect to student.html upon successful login
        res.redirect('/student.html');
    } catch (err) {
        console.error("Error during student login:", err);
        res.status(500).send("An error occurred during login");
    }
});


// Handle admin login form submission
app.post('/adminlogin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).send("Admin not found");
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }

        // Redirect to index1.html upon successful login
        res.redirect('/index1.html');
        
    } catch (err) {
        console.error("Error during admin login:", err);
        res.status(500).send("An error occurred during admin login");
    }
});

// Handle library login form submission
app.post('/login/library', async (req, res) => {
    const { email, password } = req.body;

    try {
        const library = await Library.findOne({ email });

        if (!library) {
            return res.status(400).send("Library not found");
        }

        const isMatch = await bcrypt.compare(password, library.password);

        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }

        // Redirect to library.html upon successful login
        res.redirect('/library.html');

    } catch (err) {
        console.error("Error during library login:", err);
        res.status(500).send("An error occurred during library login");
    }
});


// Serve the student.html file
app.get('/student.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

// Serve the index1.html file
app.get('/index1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

// Serve the index2.html file
app.get('/index2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

// Serve the result.html file
app.get('/result.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'result.html'));
});
// Serve the library.html file
app.get('/library.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'library.html'));
});

// Handle QR code form submission
app.post('/generateQR', upload.single('image'), async (req, res) => {
    const { name, email, phone, branch, course, usn, dob, batch, bloodGroup, address } = req.body;
    const image = req.file;

    // Check if the image file exists in the uploads folder
    const imageUrl = image ? `/uploads/${image.filename}` : null;
    if (imageUrl) {
        const imagePath = path.join(__dirname, 'uploads', image.filename);
        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({ error: 'Uploaded image file does not exist' });
        }
    }

    // Construct the QR code data
    const qrData = {
        name,
        email,
        phone,
        branch,
        course,
        usn,
        dob,
        batch,
        bloodGroup,
        address,
        imageUrl // Save imageUrl in the database
    };

    // Generate QR code
    try {
        const qrCodeData = JSON.stringify(qrData);
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);

        // Save user data to MongoDB
        const qr = new QR({
            name,
            email,
            phone,
            branch,
            course,
            usn,
            dob,
            batch,
            bloodGroup,
            address,
            imageUrl, // Save imageUrl in the database
            qrCodeImage // Save QR code image in the database
        });

        await qr.save();

        // Serve result.html with the generated QR code
        res.sendFile(path.join(__dirname, 'result.html'));
    } catch (err) {
        console.error("Error generating QR code:", err);
        res.status(500).send("An error occurred while generating the QR code");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
