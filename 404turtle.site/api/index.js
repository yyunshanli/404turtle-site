const express = require("express");
const app = express();
app.use(express.json());

let nextId = 1,
  events = [];

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/events", (req, res) => res.json(events));
app.get("/events/:id", (req, res) => {
  const x = events.find((e) => e.id == req.params.id);
  if (!x) return res.sendStatus(404);
  res.json(x);
});
app.post("/events", (req, res) => {
  const saved = { id: nextId++, ...req.body };
  events.push(saved);
  res.set("Location", `/api/events/${saved.id}`);
  res.status(201).json(saved);
});
app.put("/events/:id", (req, res) => {
  const i = events.findIndex((e) => e.id == req.params.id);
  if (i < 0) return res.sendStatus(404);
  events[i] = { ...events[i], ...req.body };
  res.json(events[i]);
});
app.delete("/events/:id", (req, res) => {
  const len = events.length;
  events = events.filter((e) => e.id != req.params.id);
  res.sendStatus(events.length === len ? 404 : 204);
});

app.listen(4000, () => console.log("API on :4000"));
