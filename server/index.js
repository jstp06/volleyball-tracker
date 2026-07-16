const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001; 

app.use(cors({
    origin: 'http://localhost:5173'
})); 


app.get('/api/hello', (req, res) => {
    res.json({ message: 'hello from server' });
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}');
});
