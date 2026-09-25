import { app } from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`📻 Groundwave API server running on http://localhost:${PORT}`);
});
