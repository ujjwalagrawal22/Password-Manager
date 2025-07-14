const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ujjwalagrawal22:GfuYNfDA3Ukmkmj9@cluster0.1yg2vir.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch((err) => console.error('MongoDB connection error:', err));
