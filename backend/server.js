
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Event = require('./models/Event');
const Registration = require('./models/Registration');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.send('CampusEvents backend is running!');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CampusEvents API is working!'
  });
});

// Register a new student
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must contain at least 6 characters.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student'
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    return res.status(500).json({
      message: 'Unable to create account. Please try again.'
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role;

    if (!email || !password ||
        !['student', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Email, password and role are required.'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: 'This account does not have the selected role.'
      });
    }

    return res.json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Unable to log in. Please try again.'
    });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.json(events);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
});

// Get one event
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found.'
      });
    }

    return res.json(event);
  } catch (error) {
    return res.status(400).json({
      message: 'Invalid event ID.'
    });
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const event = await Event.create(req.body);
    return res.status(201).json(event);
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!event) {
      return res.status(404).json({
        message: 'Event not found.'
      });
    }

    return res.json(event);
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found.'
      });
    }

    return res.json({
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Invalid event ID.'
    });
  }
});

// Register a student for an event
app.post('/api/registrations', async (req, res) => {
  try {
    const eventId = req.body.eventId;
    const studentEmail =
      req.body.studentEmail?.trim().toLowerCase();

    if (!studentEmail || !eventId) {
      return res.status(400).json({
        message: 'Student email and event ID are required.'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found.'
      });
    }

    const registration = await Registration.create({
      studentEmail,
      eventId: event._id,
      eventTitle: event.title
    });

    return res.status(201).json(registration);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You are already registered for this event.'
      });
    }

    return res.status(400).json({
      message: error.message
    });
  }
});

// Get registrations for a student
app.get('/api/registrations/:studentEmail', async (req, res) => {
  try {
    const studentEmail =
      req.params.studentEmail.trim().toLowerCase();

    const registrations = await Registration.find({
      studentEmail
    }).populate('eventId');

    return res.json(registrations);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
});

// Cancel a registration
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const registration =
      await Registration.findByIdAndDelete(req.params.id);

    if (!registration) {
      return res.status(404).json({
        message: 'Registration not found.'
      });
    }

    return res.json({
      message: 'Registration cancelled successfully.'
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Invalid registration ID.'
    });
  }
});

// Start server after MongoDB connects
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      'MongoDB connection failed:',
      error.message
    );
    process.exit(1);
  }
}

startServer();
